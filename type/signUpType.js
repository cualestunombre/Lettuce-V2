/*
회원 가입 데이터의 유효성을 검사하는 미들웨어 함수

*/

const signUpType = (req,res,next)=>{
    const { email, nickName, password, birthday} = req.body;
    const englishPattern = /[a-zA-Z]/;
    const emailPattern = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;

    const emailFlag = emailPattern.test(email);
    const nickNameFlag = length(nickName) <=20 && length(nickName)>0 ? true : false;
    const birthdayFlag =  birthday instanceof Date;
    const passwordFlag = null;


    const englishCount=0;
    const numberCount=0;
    const etcCount=0;


    password.forEach(char => { 
        if(!isNan(char)){
            numberCount+=1;
        }
        else if(englishPattern.test(char)){
            englishCount+=1;
        }
        else{
            etcCount+=1;
        }
    });

    if(englishCount>=1 && etcCount==0 && numberCount>=1 && englishCount+numberCount<=18 &&
        englishCount+numberCount>=6){
            passwordFlag=true;
        }
    else{
        passwordFlag=false;
    }
    

    if(emailFlag && nickNameFlag && birthdayFlag && passwordFlag) next();
    else{
        res.response={code:400,message:"유효한 값이 아닙니다"};
        next();
    }
}

module.exports.signUpType=signUpType;