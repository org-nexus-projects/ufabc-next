// import Chart from 'chart.js'

module.exports = new (function (){
  function getHTML (info, id) {
      var html = "<canvas id='pie" + id + "' width='200px'></canvas><br>";
      html += "<table class='table'><tbody><tr><td>CR Aluno</td><td><b>" + info.cr_aluno + "</b></td></tr><tr><td>CR Professor</td><td><b>" + info.cr_professor + "</b></td></tr><tr><td>Reprovacoes</td><td><b>" + info.reprovacoes + "</b></td></tr><tr><td>Trancamentos</td><td><b>" + info.trancamentos +"</b></td></tr></tbody></table>";
      return html;
  }

  function generate(item, id){
      var ctx = $("#pie" + id);

      var possible_colors = {
        "A" : "rgb(124, 181, 236)",
        "B" : "rgb(67, 67, 72)",
        "C": "rgb(144, 237, 125)",
        "D" : "rgb(247, 163, 92)"
      };

      var possible_hover = {
        "A" : "rgb(149, 206, 255)",
        "B" : "rgb(92, 92, 97)",
        "C": "rgb(168, 255, 150)",
        "D" : "rgb(255, 188, 117)"
      };
      
      var info = [];
      var backColor = [];
      var hoverColor = [];
      var labels = [];

      for (var key in item) {
          labels.push(key);
          info.push(item[key]);
          backColor.push(possible_colors[key]);
          hoverColor.push(possible_hover[key]);
      }

      var data = {
          labels: labels,
          datasets: [
              {
                  data: info,
                  backgroundColor: backColor,
                  hoverBackgroundColor: hoverColor
              }]
      };

    //   var myChart = new Chart(ctx, {
    //       type: 'pie',
    //       data: data
    //   });
  }

  return {
    getHTML: getHTML,
    generate: generate
  }
})()