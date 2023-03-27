module.exports.isJson=(req,res,next)=>{
    res.response={type:"json"};
};
module.exports.isRender=(req,res,next)=>{
    res.response={type:"render"};
};
