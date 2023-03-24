module.exports = function (app, songsRepository) {

    // PETICION GET

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
        res.render("add.twig");
    });

    // PETICION POST
    app.post('/songs/add', function(req, res){
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price
        }
        songsRepository.insertSong(song, function (songId){
           if (songId == null)
               res.send("Error al insertar cancion");
           else
               res.send("Agregada la cancion con ID: " + songId)
        });
    })

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