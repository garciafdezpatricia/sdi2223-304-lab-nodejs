const {ObjectID} = require("mongodb");
module.exports = function (app, songsRepository) {

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
                                       res.send("Agregada la canción ID: " + songId);
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

    app.get('/shop', function (req, res){
       let filter = {};
       let options = {sort:{title:1}};
       if (req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != ""){
           filter = {"title": {$regex: ".*" + req.query.search + ":*"}};
       }

       songsRepository.getSongs(filter, options).then(songs => {
           res.render("shop.twig", {songs: songs})
       }) .catch(error => {
           res.send("Se ha producido un error al listar las canciones: " + error)
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
        let filter = {_id: ObjectID(req.params.id)};
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
        let filter = {_id: ObjectID(songId)};
        //que no se cree un documento nuevo si no existe
        const options = {upsert: false}
        songsRepository.updateSong(song, filter, options).then(result => {
            step1UpdateCover(req.files, songId, function (result) {
                if (result == null) {
                    res.send("Error al actualizar la portada o el audio de la canción");
                } else {
                    res.send("Se ha modificado el registro correctamente");
                }
            });
        }).catch(error => {
            res.send("Se ha producido un error al modificar la canción " + error)
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

    app.get('/songs/:id', function(req, res){
       let filter = {_id: ObjectID(req.params.id)};
       let options = {};

       songsRepository.findSong(filter, options).then(song => {
           res.render("songs/song.twig", {song:song});
       }).catch(error => {
           res.send("Se ha producido un error al buscar la cancion: " + error);
       });
    });

    // **** PARAMETROS EN URL CON /VALOR ****
    app.get('/songs/:id', function(req, res) {
        let response = 'id: ' + req.params.id;
        res.send(response);
    });
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