module.exports = function (app){


    // *** DEVUELVE FORMULARIO PARA AÑADIR NUEVOS AUTORES ***
    app.get('/authors/add', function (req, res) {
        let roles = ["bateria", "guitarrista", "bajista", "cantante", "pianista"]
        let response = {roles: roles}
        res.render("authors/add.twig", response);
    });


    // *** DEVUELVE LISTA DE AUTORES HARDCODEADA ***
    app.get("/authors", function(req, res) {
        let authors = [{
            "name":"Jose",
            "grupo":"Grupo1",
            "rol":"Cantante"
        }, {
            "name":"Antonio",
            "grupo":"Grupo1",
            "rol":"Bateria"
        },{
            "name":"Miguel",
            "grupo":"Grupo1",
            "rol":"Guitarrista"
        }, {
            "name":"Patricia",
            "grupo":"Grupo1",
            "rol":"Pianista"
        }, {
            "name":"Maria",
            "grupo":"Grupo2",
            "rol":"Cantante"
        }, {
            "name":"Rita",
            "grupo":"Grupo1",
            "rol":"Bateria"
        }];
        let response = {
            authors: authors
        };

        res.render("authors/authors.twig", response);
    })

    // POST PARA AÑADIR NUEVO AUTOR
    app.post('/authors/add', function(req, res){
        let response = "";
        // check if the name is defined
        if (req.body.name !== null && req.body.name.trim() !== "" && typeof (req.body.name) !== "undefined")
            response += 'Nombre: ' + req.body.name + '<br>';
        else
            response += 'Nombre: Nombre no enviado en la peticion <br>'
        // check if the group is defined
        if (req.body.grupo !== null && req.body.grupo.trim() !== "" && typeof (req.body.grupo) !== "undefined")
            response += 'Grupo: ' + req.body.grupo + '<br>';
        else
            response += 'Grupo: Grupo no enviado en la peticion <br>'
        // check if the rol is defined
        if (req.body.rol !== null && req.body.rol.trim() !== "" && typeof (req.body.rol) !== "undefined")
            response += 'Rol: ' + req.body.rol;
        else
            response += 'Rol: Rol no enviado en la peticion'

        res.send(response);
    })

    app.get('/authors/filter/:rol', function(req, res){
        // get the rol to filter
        let requestedRol = req.params.rol;

        // hardcoded list of authors
        let authors = [{
            "name":"Jose",
            "grupo":"Grupo1",
            "rol":"Cantante"
        }, {
            "name":"Antonio",
            "grupo":"Grupo1",
            "rol":"Bateria"
        },{
            "name":"Miguel",
            "grupo":"Grupo1",
            "rol":"Guitarrista"
        }, {
            "name":"Patricia",
            "grupo":"Grupo1",
            "rol":"Pianista"
        }, {
            "name":"Maria",
            "grupo":"Grupo2",
            "rol":"Cantante"
        }, {
            "name":"Rita",
            "grupo":"Grupo1",
            "rol":"Bajista"
        }];

        let filteredAuthors = authors.filter(author => author.rol.trim().toLowerCase()
            === requestedRol.trim().toLowerCase())

        let response = {
            authors: filteredAuthors
        }

        res.render("authors/authors.twig", response);

    });

    app.get('/authors/*', function (req, res) {
        res.redirect("/authors/");
    });
}