const {ObjectId} = require("mongodb");

module.exports = function (app, songsRepository, commentsRepository) {

    // **** PARAMETROS EN URL CON ? CLAVE=VALOR ****
    app.get("/songs", function(req, res) {
        let songs = [{
            "title":"Blank Space",
            "price":"1.12"
        }, {
            "title":"See you again",
            "price":"1.3"
        },{
            "title":"Uptown Funk",
            "price":"1.1"
        }];
        let response = {
            seller : "Tienda de canciones",
            songs : songs
        };

        res.render("shop.twig", response);
    })

    // *** DEVUELVE FORMULARIO PARA AÑADIR NUEVAS CANCIONES ***
    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig");
    });

    app.post('/songs/add', function(req, res){
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        songsRepository.insertSong(song, function (songId){
           if (songId == null)
               res.send("Error al insertar cancion");
           else {
               if (req.files != null) {
                   let imagen = req.files.cover;
                   imagen.mv(app.get("uploadPath") + '/public/covers/' + songId + '.png', function (err) {
                       if (err) {
                           res.send("Error al subir la portada de la canción")
                       } else {
                           if (req.files.audio != null) {
                               let audio = req.files.audio;
                               audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                                   if (err) {
                                       res.send("Error al subir el audio");
                                   } else {
                                       res.redirect('/publications')
                                   }
                               });
                           }
                       }
                   })
               } else {
                   res.send("Agregada la canción ID: " + songId)
               }
           }
        });
    })

    app.get('/songs/:id', function (req, res) {
        let songId = ObjectId(req.params.id);
        let filter = {_id: ObjectId(req.params.id)};
        let options = {};
        songsRepository.findSong(filter, options).then(song => {
            let user = req.session.user;
            userCanBuySong(user, songId, function(canBuy) {
                let filterComment = {song_id: song._id}
                commentsRepository.getComments(filterComment, options).then(comments => {
                    let settings = {
                        url: "https://www.freeforexapi.com/api/live?pairs=EURUSD",
                        method: "get",
                        headers: {
                            "token": "ejemplo",
                        }
                    }
                    let rest = app.get("rest");
                    rest(settings, function (error, response, body) {
                        console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                        let responseObject = JSON.parse(body);
                        let rateUSD = responseObject.rates.EURUSD.rate;
                        // nuevo campo "usd" redondeado a dos decimales
                        let songValue= rateUSD * song.price;
                        song.usd = Math.round(songValue * 100) / 100;
                        res.render("songs/song.twig", {song: song, comments: comments, canBuy: canBuy});
                    })
                })
            });
        }).catch(error => {
            res.send("Se ha producido un error al buscar la canción " + error)
        });

    })

    app.get('/shop', function (req, res){
       let filter = {};
       let options = {sort:{title:1}};
       if (req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != ""){
           filter = {"title": {$regex: ".*" + req.query.search + ":*"}};
       }
        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") { // puede no venir el param
            page = 1;
        }
        songsRepository.getSongsPg(filter, options, page).then(result => {
            let lastPage = result.total / 4;
            if (result.total % 4 > 0) { // Sobran decimales
                lastPage = lastPage + 1;
            }
            let pages = []; // paginas mostrar
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            let response = {
                songs: result.songs,
                pages: pages,
                currentPage: page
            }
            res.render("shop.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error)
        });
    });

    app.get('/publications', function (req, res) {
        let filter = {author : req.session.user};
        let options = {sort: {title: 1}};
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("publications.twig", {songs: songs});
        }).catch(error => {
            res.send("Se ha producido un error al listar las publicaciones del usuario:" + error)
        });
    })

    app.get('/songs/edit/:id', function(req, res) {
        let filter = {_id: ObjectId(req.params.id)};
        songsRepository.findSong(filter, {}).then(song => {
            res.render("songs/edit.twig", {song: song});
        }).catch(error => {
            res.send("Se ha producido un error al recuperar la cancion " + error)
        });
    })

    app.post('/songs/edit/:id', function(req, res){
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        let songId = req.params.id;
        let filter = {_id: ObjectId(songId)};
        //que no se cree un documento nuevo si no existe
        const options = {upsert: false}
        songsRepository.updateSong(song, filter, options).then(result => {
            step1UpdateCover(req.files, songId, function (result) {
                if (result == null) {
                    res.send("Error al actualizar la portada o el audio de la canción");
                } else {
                    res.redirect('/publications')
                }
            });
        }).catch(error => {
            res.send("Se ha producido un error al modificar la canción " + error)
        });
    })

    app.get('/songs/delete/:id', function (req, res) {
        let filter = {_id: ObjectId(req.params.id)};
        songsRepository.deleteSong(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el registro");
            } else {
                res.redirect("/publications");
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la canción: " + error)
        });
    })

    app.get('/songs/buy/:id', function (req, res) {
        let songId = ObjectId(req.params.id);
        let shop = {
            user: req.session.user,
            songId: songId
        }
        userCanBuySong(req.session.user, songId, function(canBuy){
          if (canBuy){
              songsRepository.buySong(shop, function (shopId) {
                  if (shopId == null) {
                      res.send("Error al realizar la compra");
                  } else {
                      res.redirect("/purchases");
                  }
              })
          }  else {
              res.send("Esta canción ya te pertenece")
          }
        })
        // let canBuy = userCanBuySongAsync(req.session.user, songId);
        // if (canBuy){
        //   songsRepository.buySong(shop, function (shopId) {
        //       if (shopId == null) {
        //           res.send("Error al realizar la compra");
        //       } else {
        //           res.redirect("/purchases");
        //       }
        //   })
        // } else {
        //     res.send("Esta cancion ya te pertenece");
        // }
    });

    app.get('/purchases', function (req, res) {
        let filter = {user: req.session.user};
        let options = {projection: {_id: 0, songId: 1}};
        songsRepository.getPurchases(filter, options).then(purchasedIds => {
            let purchasedSongs = [];
            for (let i = 0; i < purchasedIds.length; i++) {
                purchasedSongs.push(purchasedIds[i].songId)
            }
            let filter = {"_id": {$in: purchasedSongs}};
            let options = {sort: {title: 1}};
            songsRepository.getSongs(filter, options).then(songs => {
                res.render("purchase.twig", {songs: songs});
            }).catch(error => {
                res.send("Se ha producido un error al listar las publicaciones del usuario: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error)
        });
    })

    /**
     * Intentar subir la portada:
     * a) si se produce un error al subir la portada enviamos una respuesta de error
     * b) si se ube correctamente vamos a paso 2 e intentamos subir el audio
     * c) si no habia portada vamos al paso 2
     * @param files
     * @param songId
     * @param callback
     */
    function step1UpdateCover(files, songId, callback) {
        if (files && files.cover != null) {
            let image = files.cover;
            image.mv(app.get("uploadPath") + '/public/covers/' + songId + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    step2UpdateAudio(files, songId, callback); // SIGUIENTE
                }
            });
        } else {
            step2UpdateAudio(files, songId, callback); // SIGUIENTE
        }
    };

    /**
     * Intentar subir el audio:
     * a) si se produce un error al subir la portada enviamos una respuesta de error
     * b) si se sube correctamente, finalizamos
     * c) si no habia audio, finalizamos
     * @param files
     * @param songId
     * @param callback
     */
    function step2UpdateAudio(files, songId, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    };

    // se llama en song/id
    function userCanBuySong(user, songId, callbackFunction) {
        let filterSongAuthor = {$and: [{"_id": songId}, {"author": user}]};
        let filterBoughtSong = {$and: [{"songId": songId}, {"user": user}]};
        let options = {};
        songsRepository.getSongs(filterSongAuthor, options).then(songs => {
            if (songs === null || songs.length > 0){
                callbackFunction(false);
            }
            else{
                songsRepository.getPurchases(filterBoughtSong, options).then(purchaseIds => {
                    if (purchaseIds === null || purchaseIds.length > 0)
                        callbackFunction(false);
                    else
                        callbackFunction(true);
                }).catch(error => {
                    callbackFunction(false)
                })
            }
        }).catch(error => {
            callbackFunction(false);
        })
    }

    async function userCanBuySongAsync(user, songId){
        let filterSongAuthor = {$and: [{"_id": songId}, {"author": user}]};
        let filterBoughtSong = {$and: [{"songId": songId}, {"user": user}]};
        let options = {};
        songsRepository.getSongs(filterSongAuthor, options).then(songs => {
            if (songs === null || songs.length > 0){
                return false;
            }
            else{
                songsRepository.getPurchases(filterBoughtSong, options).then(purchaseIds => {
                    if (purchaseIds === null || purchaseIds.length > 0)
                        return false;
                    else
                        return true;
                }).catch(error => {
                    return false;
                })
            }
        }).catch(error => {
            return false;
        })
    }


    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });

    app.get('/promo*', function (req, res) {
        res.send('Respuesta al patrón promo*');
    });
    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });
}