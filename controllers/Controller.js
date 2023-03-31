const express= require("express");
module.exports.Controller = class Controller{
    constructor(){
        this.router = express.Router();
        this.initializeRoutes();
    }
}