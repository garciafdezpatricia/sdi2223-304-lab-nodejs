module.exports = function (app) {

    // **** PARAMETROS EN URL CON ? CLAVE=VALOR ****
    app.get("/songs", function(req, res) {
        let response = "";
        // check if the title is defined
        if (req.query.title != null && typeof (req.query.title) != "undefined")
            response = 'Título: ' + req.query.title + '<br>';
        // check if the author is defined
        if (req.query.author != null && typeof (req.query.author) != "undefined")
            response += 'Autor: ' + req.query.author;

        res.send(response);
    })

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
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
}