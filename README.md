# [Lettuce-V2]
소프트웨어의 재사용성과 유지보수성을 높이는 것은 소프트웨어 개발에서 중요한 요소임. 그러나, 
기존 Lettuce 프로젝트는 구현의 중점을 둬 코드의 재사용성과 유지보수성이 좋지 못함.
따라서 재사용성과 유지보수성 향상을 목적으로 하여, Lettuce-V2를 만들고자 함.


Requirements Specification(요구사항 명세)

1. 라우터를 객체화 하고, 미들웨어(req,res)함수를 라우터의 멤버 함수화 하고자 함. 또한,복잡한
미들웨어 내부의 로직을 서비스 모듈화 할 것임. 이로 인해 코드의 재사용성과 유지보수성이 향상되고, 
단위테스트가 용이해질 것임. 
2. 기존의 DB쿼리는 가독성이 떨어지고, 하나의 로직에 너무 많은 쿼리가 남용되어, 성능 저하가 발생하였음.
따라서, 쿼리의 가독성을 높이고, 사용되는 쿼리의 개수를 줄이려고 함.
3. 기존의 url은 restful하지 못하게 설계 되었음. url을 좀 더 구조화하고 restful하게 설계하고자 함. 
4. ajax를 사용할 때, 예외처리가 완벽하지 못함. 프론트 단에서, ajax사용 시 완벽한 예외처리를 추구하고자 함.
5. 실시간 채팅의 로직이 지나치게 복잡함. 설계하고 구현한 본인 조차, 유지보수하기 힘들 정도임. 로직을 좀 더 구조화하여, 유지 보수성을 높이고자 함. 
6. 기존에는 서버 운영 시 로그를 남기고 있지 않아, 누가 접속했고, 어떤 에러가 발생하였는 지에 대한 정보를 관리하지 못하고 있음. 따라서, 로그를 남기는 기능을 추가하고자 함
7. nginx를 리버스 프록시로 두어 정적 파일을 제공하도록 하여, 웹어플리케이션 서버의 부하를 줄이고자 함. 
8. javascript및 html&css도 구조를 명확히하여, 유지보수성을 높이고자 함. 
9. CSRF/XSS공격을 대비하는 코드를 작성할 것.
10. 기존 코드는 유효성 검사가 빈약함. 유효성 검사를 더욱 엄격하게 할 것임. 
11. 정적 파일 제공(html,css,image 등등)을 제외한 모든 요청은 공통 컨트롤러를 통해 처리할 것임. 
12. 프론트 컨트롤러를 작성하여, 접속로그를 남기고자 함. 
13. 최종적으로 서비스 객체에 대한 유닛테스트와 미들웨어(req,res)에대한 통합테스트 커버리지 100%를 달성하고자 함.
14. 추후 유지보수의 편의성을 위해, System architecture, Usecase diagram, Usecase descriptions를 작성한다.

Defects of current system(현재 시스템의 결함)

1. 남의 채팅방에 들어갈 수 있다. --> 그렇지 않도록 해결해야 함
2. 온 지 24시간 이후의 알림들은 모두 삭제해야 한다 --> 스케쥴러를 활용해야 함
3. 클라이언트 뿐 아니라, 서버에서 글자 수를 제한해야 한다 --> 서버에서 검증할 것




Requirements of the next version(차기 버전 요구사항)

1. 타입스크립트를 적용해서 타입안정성을 높일 것
2. 단체 채팅기능을 구현할 것
3. 관리자 페이지를 추가하여 접속정보 제공 및 회원관리 기능을 제공
4. 스토리 기능을 추가할 것 
5. 세련된 디자인을 도입할 것
6. 기존에는 동영상을 다운로드 방식으로 제공했으나, 스트리밍 방식으로 동영상을 제공할 것 

