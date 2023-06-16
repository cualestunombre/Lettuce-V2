 

module.exports.timeConverter = (ele) => {
  const now = new Date().getTime();
    if (now - ele.createdAt.getTime() > 3600 * 1000) {
      ele.time = `${parseInt(parseInt((now - ele.createdAt.getTime()) / 1000) / 3600)}시간전`;
    } else if (now - ele.createdAt.getTime() <= 60 * 1000) {
      ele.time = `${parseInt((now - ele.createdAt.getTime()) / 1000)}초전`;
    } else {
      ele.time = `${parseInt(parseInt((now - ele.createdAt.getTime()) / 1000) / 60)}분전`;
    }
}

module.exports.dateTimeConverter = (ele)=>{
  const now = new Date().getTime();
  if(now-ele.createdAt.getTime()>3600*1000 && now-ele.createdAt.getTime()<3600*1000*24){
      ele.time=`${parseInt(parseInt((now-ele.createdAt.getTime())/1000)/3600)}시간전`;
  }
  else if(now-ele.createdAt.getTime()>=3600*1000*24){
      ele.time=`${parseInt(parseInt((now-ele.createdAt)/1000)/(86400))}일전`;
  }
  else if(now-ele.createdAt.getTime()<=60*1000){
      ele.time=`${parseInt((now-ele.createdAt.getTime())/1000)}초전`;
  }
  else{
      ele.time=`${parseInt(parseInt((now-ele.createdAt.getTime())/1000)/60)}분전`;
  }
}

module.exports.KSTConverter = (ele)=>{
  for(let i = 0; i<ele.length;i++){
    let date = ele[i]['Chats.createdAt'];
    let sendDate = date.getFullYear()+'년 '+(parseInt(date.getMonth())+1)+'월 '+date.getDate()+"일 ";         
    if(date.getHours()<12){
        sendDate+="오전 "+date.getHours()+"시 ";
    }
    else{
        sendDate+='오후 '+(parseInt(date.getHours())-12)+"시 ";
    }
    sendDate+=+date.getMinutes()+"분";
    ele[i].time = sendDate;
    
}
}