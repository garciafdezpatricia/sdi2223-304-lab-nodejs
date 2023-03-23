module.exports = function (app) {

    // PETICION GET
    app.get('/promo*', function (req, res) {
        res.send('Respuesta al patrón promo*');
    });
    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });

    // **** PARAMETROS EN URL CON ? CLAVE=VALOR ****
    app.get("/songs", function(req, res) {
        // let response = "";
        // // check if the title is defined
        // if (req.query.title != null && typeof (req.query.title) != "undefined")
        //     response = 'Título: ' + req.query.title + '<br>';
        // // check if the author is defined
        // if (req.query.author != null && typeof (req.query.author) != "undefined")
        //     response += 'Autor: ' + req.query.author;

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

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
    })

    // *** DEVUELVE FORMULARIO PARA AÑADIR NUEVAS CANCIONES ***
    app.get('/songs/add', function (req, res) {
        res.render("add.twig");
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


    // PETICION POST
    app.post('/songs/add', function(req, res){
        let response = "Canción agregada: " + req.body.title + "<br>" +
            " género: " + req.body.kind + "<br>" + " precio: " + req.body.price;
        res.send(response);
    })
}