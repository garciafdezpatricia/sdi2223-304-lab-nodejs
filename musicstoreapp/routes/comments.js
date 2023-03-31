const {ObjectId} = require("mongodb");

module.exports = function (app, commentsRepository){
    app.post('/comments/:song_id', function (req, res) {
        let comment = {
            author: req.session.user,
            text: req.body.comment,
            song_id: ObjectId(req.params.song_id)
        }
        if (typeof (req.body.comment) === "undefined" || comment.text.trim().length == 0){
            res.send("El comentario no puede estar vacío o no definido");
        }
        else{
            commentsRepository.insertComment(comment).then(result => {
                res.redirect(`/songs/${comment.song_id}`)
            }).catch(error => res.send("Se ha producido un error al enviar el comentario: " + error))
        }
    })

}