const questions = await fetch('questions.json').then(r => r.json());
let index=0;
const feedback=document.querySelector('#feedback');
function render(){const question=questions[index];document.querySelector('#question').textContent=question.question;document.querySelector('#answers').replaceChildren();feedback.textContent='';document.querySelector('#next').hidden=true;for(const answer of question.answers){const button=document.createElement('button');button.textContent=answer;button.addEventListener('click',()=>{feedback.textContent=answer===question.correct?'Harika! Birlikte keşfettik.':'Bir daha düşün. Bütün kaç eşit parçaya ayrıldı?';document.querySelector('#next').hidden=answer!==question.correct;});document.querySelector('#answers').append(button);}}
document.querySelector('#next').addEventListener('click',()=>{index=(index+1)%questions.length;render();});render();
