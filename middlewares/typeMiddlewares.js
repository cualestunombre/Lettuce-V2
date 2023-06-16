/*
회원 가입 데이터의 유효성을 검사하는 미들웨어 함수
*/

const e = require("express");



const signUpType = (req, res, next) => {
    const { email, nickName, password, birthday } = req.body;
    const englishPattern = /[a-zA-Z]/;
    const emailPattern = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
  
    const emailFlag = emailPattern.test(email);
    const nickNameFlag = nickName.length <= 20 && nickName.length > 0;
    const birthdayFlag = birthday instanceof Date;
    let passwordFlag = false;
  
    let englishCount = 0;
    let numberCount = 0;
    let etcCount = 0;
  
    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      if (!isNaN(parseInt(char))) {
        numberCount += 1;
      } else if (englishPattern.test(char)) {
        englishCount += 1;
      } else {
        etcCount += 1;
      }
    }
  
    if (englishCount >= 1 && etcCount == 0 && numberCount >= 1 && englishCount + numberCount <= 18 && englishCount + numberCount >= 6) {
      passwordFlag = true;
    }
  
    if (emailFlag && nickNameFlag && birthdayFlag && passwordFlag) {
      next();
    } else {
      res.response = { code: 400, message: "유효한 값이 아닙니다" };
      next('route');
    }
  };


  /*
  바디의 postId를 검증하는 미들웨어 함수
  */

  const bodyPostIdType = (req,res,next)=>{
        if(!req.body.postId){
            res.response.code=400;
            res.response.message="게시글 id를 body에 담아 주세요";
            next("route");
        }
        else if(isNaN(Integer.parseInt(req.body.postId))){
            res.response.code=400;
            res.response.message = "유효한 id값이 아닙니다";
            next('route');
        }
        else{
            next();
        }

  }

  /*
  쿼리의 postId를 검증하는 미들웨어 함수
  */
  const queryPostIdType= (req,res,next)=>{
    if(!req.query.PostId){
        res.response.code=400;
        res.response.message="게시글 id를 query에 담아 주세요";
        next('route');
    }
    else if(isNaN(Integer.parseInt(req.query.PostId))){
        res.response.code=400;
        res.response.message = "유효한 id값이 아닙니다";
        next('route');
    }
    else{
        next();
    }
  }
  /*
  쿼리의 cnt를 검증하는 미들웨어 함수;
  */
  const queryCntType = (req,res,next)=>{
      if(!req.query.cnt){
          res.response.code=400;
          res.response.message="페이지 cnt를 query에 담아 주세요";
          next('route');
      }
      else if(isNaN(Integer.parseInt(req.query.cnt))){
          res.response.code=400;
          res.response.message = "유효한 cnt값이 아닙니다";
          next('route');
      }
      else{
          next();
      }
  }
  /*
  쿼리의 search를 검증하는 미들웨어 함수
  */
 const querySearchType = (req,res,next)=>{
     if(!req.query.search){
         res.response.code=400;
         res.response.message="search를 query에 담아 주세요";
         next('route');
     }
     else{
         next();
     }
 }
 /*
 바디의 email을 검증하는 미들웨어 함수
 */
const bodyEmailType = (req,res,next)=>{
    if(!req.body.email){
        res.response.code=400;
        res.response.message="이메일을 body에 담아 주세요";
        next("route");
    }
    const email = req.body.email;
    const emailPattern = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    const emailFlag = emailPattern.test(email);
    if(emailFlag){
        next();
    }
    else{
        res.response.code=400;
        res.response.message="유효한 이메일이 아닙니다";
        next("route");
    }

}
/*
전송자와 수신자의 id를 검증하는 미들웨어 함수
*/
const bodySenderReceiverType = (req,res,next)=>{
  if(!req.body.sender || !req.body.target){
    res.response.code=400;
    res.response.message="전송자와 수신자의 id를에 body에 담아주세요";
    next("route");
  }
  else{
    if (isNaN(Integer.parseInt(req.body.sender))||isNaN(Integer.parseInt(req.body.target))){
      res.response.code=400;
      res.response.message="유효한 id를 body에 담아 주세요";
      next("route");
    }
    else{
      next();
    }
    
  }
}
const queryIdType = (req,res,next)=>{
  if(!req.query.id || isNaN(Integer.parseInt(req.query.id))){
    res.response.code=400;
    res.response.message="유효한 id를 query에 담아 주세요";
    next("route");
  }
  else{
    next();
  }
}

const queryOffsetType = (req,res,next)=>{
  if(!req.query.offset || isNaN(Integer.parseInt(req.query.offset))){
    res.response.code=400;
    res.response.message="유효한 offset을 query에 담아 주세요";
    next("route");
  }else{
    next();
  }
}
  module.exports.queryOffsetType = queryOffsetType;
  module.exports.queryPostIdType = queryPostIdType;
  module.exports.bodyPostIdType = bodyPostIdType;
  module.exports.signUpType = signUpType;
  module.exports.queryCntType = queryCntType;
  module.exports.querySearchType=querySearchType;
  module.exports.bodyEmailType=bodyEmailType;
  module.exports.bodySenderReceiverType=bodySenderReceiverType;
  module.exports.queryIdType=queryIdType;

  