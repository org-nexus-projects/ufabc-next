import Toastify from "toastify-js";


//function getValuesFromMainPageSigaa(){

//Scrapping Sigaa values 
// Get values from table 
const trs = document.querySelectorAll('#agenda-docente tbody tr')

// transform to key-value object 
const keypair = Array.from(trs)
    .map((line) => Array.from(line.children)
        .map((column) => normalizeDiacritcs(column.innerText)))

const completeObject = Object.fromEntries(keypair)


completeObject
//}



// or accents
function normalizeDiacritcs(stringElement) {
    return stringElement.trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
}


function isIndexSigaa() {
    return (
        document.location.href.indexOf("https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf") !== -1
    );
}



// function getValuesFromGetGradesPageSigaa(){


//   // * Data da consulta no SIGAA
//   // preferi pegar o innerText ao invés do innerHTML por conta de trim()
//   const updateTimeHTML = document
//   .querySelector('.dataAtual')
//   .innerText.split(' ');

// // escolhi pegar os valores diretamente mas não acredito ser a melhor opção
// const updateDate = updateTimeHTML[2];
// const updateHour = updateTimeHTML[3];

// // * dados do aluno
// const studentDataHTML = document.querySelector(
//   '#identificacao > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(1) > td'
// ).innerText;

// const [nameStudent, ra] = studentDataHTML.trim().split(' - ');
// // pegar curso!

// // quads
// const quadsTableHTML = Array.from(
//   document.getElementsByClassName('tabelaRelatorio')
// );

// // dá pra deixar em um reduce ou map muito foda
// // for Of
// // histórico completo
// let studentHistory = new Map();
// for (let table of quadsTableHTML) {
//   const [year, quad] = table
//     .getElementsByTagName('caption')[0]
//     .innerText.split('.');

//   if (!studentHistory.has(year)) {
//     studentHistory.set(year, new Object());
//   }

//   const tableHeaders = Array.from(table.getElementsByTagName('th'));
//   const tableRows = Array.from(table.querySelectorAll('tbody > tr'));

//   const quadData = [];

//   // dá pra melhorar isso aqui, tá zuado
//   // usar a estrutura Set em alguns momentos para evitar repetições!!!
//   // e quando essa página estiver vazia?
//   for (let row of tableRows) {
//     const cells = Array.from(row.children).map((cell) => cell.innerText);
//     const disciplineInfo = {};
//     cells.forEach((item, index) => {
//       disciplineInfo[tableHeaders[index].innerText] = item;
//     });
//     quadData.push(disciplineInfo);
//   }

//   studentHistory.get(year)[quad] = [...quadData];
// }

// const result = {
//   updateTime: new Date(`${updateDate} ${updateHour}`), // tá retornando junho, cuidado!
//   userData: {
//     name: nameStudent,
//     ra,
//   },
//   history: Object.fromEntries(studentHistory),
// };
// console.log('');
// console.log('');
// console.log('');
// console.log(
//   '========== Parabéns por participar da versão Beta disso aqui kkkkkk ============'
// );
// console.log('TO-DO:');
// console.log('[] remover campos vazios da tabela;');
// console.log('[] verificar possíveis repetições de dados');
// console.log('[] pegar o curso do aluno');
// console.log('[] Adaptação para quadrimestre suplementar');
// console.log('[] cada quadrimestre suplementar é uma tabela na página do SIGAA');
// console.log('qualquer coisa me chama no zap');
// console.log(result);

//     }

const toast = new Toastify({
    text: `
      <div class='toast-loading-text' style='width: 250px'>
        <p style="padding-bottom: 8px;">Atualizando suas informações...</p>\n\n
        <b>Olá ${completeObject["e-mail"]}</b>
        <p>apenas aguarde, no máx. 5 min 🙏</p>
      </div>`,
    duration: -1,
    close: false,
    gravity: "bottom",
    position: "right",
    escapeMarkup: false,
    style: {
        background: "linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));",
    },
});


if (isIndexSigaa()) {

    const observer = new MutationObserver(list => {
        if (document.contains(document.querySelector('.notas'))) {
            console.log("It's in the DOM!");
            toast.showToast();
            observer.disconnect();
        }
        
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });


}


