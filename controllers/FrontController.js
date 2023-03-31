const express = require("express");
const {Controller} = require("./Controller");
module.exports.FrontController = class FrontController extends Controller{
    
   
    initializeRoutes(){
        const router = express.Router();
        router.use(commonHandler);
        this.router.use(router);
    }
    commonHandler=(req,res,next)=>{
        // 누가 접속했는 지 로그를 남김
        next();
    }
}
