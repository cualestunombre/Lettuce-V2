/*
회원 가입 데이터의 유효성을 검사하는 미들웨어 함수

*/

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
      next();
    }
  };
  
  module.exports.signUpType = signUpType;