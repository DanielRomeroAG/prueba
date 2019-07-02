const ctrl = {};
const path = require('path');
const { randomNumber } = require('../helpers/libs');
const fs = require('fs-extra');
const { Image, Comment } = require('../models');
const md5 = require('md5');
const sidebar = require('../helpers/sidebar');


ctrl.index = async (req, res) => {
    let viewModel = { image: {}, comments: {} };

    const image = await Image.findOne({ filename: { $regex: req.params.image_id } }); //consulta con parametros y me devuelve un valor
    if (image) {
        image.views = image.views + 1;
        viewModel.image = image;
        await image.save();
        const comments = await Comment.find({ image_id: image._id });
        viewModel.comments = comments;
        viewModel = await sidebar(viewModel);
        res.render('image', viewModel);
    } else {
        res.redirect('/');
    }


};

ctrl.create = (req, res) => {
    const saveImage = async () => {
        const imageURL = randomNumber();

        const images = await Image.find({ filename: imageURL });//validacion con consulta a base de datos
        if (images.length > 0) {
            saveImage();
        } else {
            const imageTempPath = req.file.path;
            const ext = path.extname(req.file.originalname).toLowerCase();//obtiene la extension de la foto
            const targetPath = path.resolve(`src/public/upload/${imageURL}${ext}`);

            if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
                await fs.rename(imageTempPath, targetPath);//mueve un archivo de un direcctorio a otro
                const newImg = new Image({
                    title: req.body.title,
                    filename: imageURL + ext,
                    description: req.body.description

                });
                const imageSave = await newImg.save();

                res.redirect('/images/' + imageURL);
            } else {
                await fs.unlink(imageTempPath);
                res.status(500).json({ error: 'Only Images are allowed' });
            }
        }

    };
    saveImage();



};

ctrl.like = async (req, res) => {
    const image = await Image.findOne({ filename: { $regex: req.params.image_id } });
    if (image) {
        image.likes = image.likes + 1;
        await image.save();
        res.json({ likes: image.likes });
    } else {
        res.status(500).json({ error: 'Error interno' });
    }
};

ctrl.comment = async (req, res) => {
    const image = await Image.findOne({ filename: { $regex: req.params.image_id } });
    if (image) {
        const newComment = new Comment(req.body);
        newComment.gravatar = md5(newComment.email);
        newComment.image_id = image._id;
        await newComment.save();
        //console.log(newComment);
        res.redirect('/images/' + image.uniqueId);
    } else {
        res.redirect('/');
    }

};

ctrl.remove = async (req, res) => {
    const image = await Image.findOne({ filename: { $regex: req.params.image_id } });
    if (image) {
        await fs.unlink(path.resolve('./src/public/upload/' + image.filename));
        await Comment.deleteOne({ image_id: image._id });
        await image.remove();
        res.json(true);
    }
    //console.log(req.params.image_id);
};

module.exports = ctrl;