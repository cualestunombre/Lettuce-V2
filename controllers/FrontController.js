const express = require("express");

module.exports.FrontController = class FrontController{
    router = express.Router();
    constructor(){
        this.initializeRoutes();
    }
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
