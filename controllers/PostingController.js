
const express = require("express");
const Controller = require("./Controller");
const multer = require("multer");
const path = require("path");
const {Post,PostMedia,HashTag} = require("../models");
const { isLoggedIn } = require('./middlewares');
const {v4:uuidv4}=require('uuid');
const { isJson } = require("../middlewares/returnTypeMiddlewares");
const { queryIdType } = require("../middlewares/typeMiddleWares");
const { isMyPost } = require("../middlewares/authMiddlewares");
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, uuidv4() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024*1024*1024 },
})


module.exports.PostingController = class PostingController extends Controller{
    path="/posting";
    initializeRoutes(){
        const router = express.Router();
        router
        .post("/uploads",isJson,isLoggedIn,upload.array("files"),this.handleUpload)
        .delete("/post",isJson,isLoggedIn,queryIdType,isMyPost,this.handleDelete);
        this.router.use(this.path,router);
    }

    handleUpload=async(req,res,next)=>{
        try{
            const data = await Post.create({
                UserId: req.user.id,
                content: req.body.content    
            });

            const hashtags = req.body.content.match(/#[^\s#]+/g);
            if(hashtags){
                for (let i=0;i<hashtags.length;i++){
                    await HashTag.create({hashtag:hashtags[i],PostId:data.dataValues.id});
                }
            }

            if(req.files==undefined||req.files.length==0){
                throw(new Error("사진을 업로드 해주세요"))
            }

            for (let i=0 ; i<req.files.length;i++){
                let type='img';
                if(path.extname(req.files[i].path)=='.jpeg'||path.extname(req.files[i].path)=='.jpg'||path.extname(req.files[i].path)=='.png'||path.extname(req.files[i].path)=='.gif'){
                    type='img';
                }
                else{
                    type="video";
                }
                await PostMedia.create({
                    PostId: data.dataValues.id,
                    src: '/'+req.files[i].path,
                    type:type
                });
            }
            res.response={...res.response,code:200,message:"게시글을 성공적으로 업로드 했어요"};
            next();
        }catch(err){
            return next(err);
        }
        
    }
    handleDelete=async (req,res,next)=>{
        try{
            await Post.destroy({where:{id:req.query.id}});
            res.response={...res.response,code:200,message:"게시글을 성공적으로 삭제 했어요"};
        }catch(err){
            next(err);
        }
        
    }

}






