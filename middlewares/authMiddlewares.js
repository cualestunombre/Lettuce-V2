
exports.isLoggedIn = (req,res,next)=>{
    if(req.isAuthenticated()){
        next();
    }
    else{
        res.response.isAuth=true;
        next(new Error("로그인이 필요합니다"));
    }
}
exports.isNotLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        next();
    }
    else{
        res.response.isAuth=true;
        next(new Error("이미 로그인 한 상태입니다"));
    }
}
exports.fromServer = (req,res,next)=>{
    const {secret} = require("../message.json");
    if(req.body.secret!=secret){
        res.response.isAuth = true;
        next(new Error("유효한 요청이 아닙니다"));
    }
    else{
        next();
    }
}