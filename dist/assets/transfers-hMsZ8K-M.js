import"./styles-DoX-3eds.js";/* empty css               */let d=0,l=0,A=0,h=0,k,s;d3.csv("https://www.donneesquebec.ca/recherche/dataset/93ce9cb5-0811-48e5-885e-98dce192d293/resource/7b8e1f0b-8715-491a-a398-685ecae6438d/download/donn_transf_prop_reqst.csv").then(i=>{const C={1:"Bas-Saint-Laurent",2:"Saguenay-Lac-Saint-Jean",3:"Capitale-Nationale",4:"Mauricie",5:"Estrie",6:"Montréal",7:"Outaouais",8:"Abitibi-Témiscamingue",9:"Côte-Nord",10:"Nord-du-Québec",11:"Gaspésie-Îles-de-la-Madeleine",12:"Chaudière-Appalaches",13:"Laval",14:"Lanaudière",15:"Laurentides",16:"Montérégie",17:"Centre-du-Québec"};i.forEach(t=>{t.Month=d3.timeParse("%Y-%m-%d")(t.DT_DEBUT_MOIS),t.Year=d3.timeFormat("%Y")(t.Month),t.MonthFormatted=d3.timeFormat("%Y-%m")(t.Month),t.NB_REQST=+t.NB_REQST,t.Region=C[+t.ID_REGN_ADMIN]}),d3.min(i,t=>t.Month),d3.max(i,t=>t.Month),A=d3.max(i,t=>t.NB_REQST),l=d3.scaleSequential(d3.interpolateViridis).domain([A,0]);const y=d3.select("#regionSelector");y.selectAll("option").remove();const R=d3.select("#timeSelector"),u=d3.select("#dateSelector"),w=R.property("value"),F=(t,a)=>d3.rollups(t,o=>d3.sum(o,e=>e.NB_REQST),o=>a==="month"?o.MonthFormatted:o.Year,o=>o.Region),Q=t=>{const a={};return t.forEach(([o,e])=>{e.forEach(([p,L])=>{a[p]||(a[p]={}),a[p][o]=L})}),a},Y=(t,a)=>{const o=Array.from(new Set(t.map(e=>a==="month"?e.MonthFormatted:e.Year)));u.selectAll("option").remove(),u.append("option").attr("value","AA-MM").text("AA-MM"),o.forEach(e=>{u.append("option").attr("value",e).text(e)})};let _=F(i,w),f=Q(_);const n={top:50,right:100,bottom:150,left:145},N=940-n.left-n.right,g=600-n.top-n.bottom,V=n.left+100,x=d3.select("#heatmap").append("svg").attr("width",N+n.left+n.right).attr("height",g+n.top+n.bottom).append("g").attr("transform","translate("+V+","+n.top+")"),c=d3.scaleBand().range([0,N]).padding(.01),T=d3.scaleBand().range([g,0]).padding(.01),P=Array.from(new Set(i.map(t=>t.MonthFormatted))),v=Object.keys(f);c.domain(P),T.domain(v);const $=x.append("g").attr("class","x axis text-sm").attr("transform","translate(0,"+g+")");$.call(d3.axisBottom(c).tickValues(c.domain().filter(function(t,a){return!(a%3)}))).selectAll("text").attr("transform","rotate(-45)").style("text-anchor","end"),x.append("g").attr("class","y axis text-sm").call(d3.axisLeft(T)),x.append("text").attr("class","axis-label text-xl font-semibold").attr("text-anchor","middle").attr("x",N/2).attr("y",g+88).text("Mois"),x.append("text").attr("class","axis-label text-xl font-semibold").attr("text-anchor","middle").attr("transform","rotate(-90)").attr("x",-g/2).attr("y",-220).text("Régions");const B=d3.select("body").append("div").attr("class","tooltip").style("opacity",0),S=(t,a,o,e)=>{const p=a==="month"?"Mois":"Année";d3.select(".axis-label").text(p);const L=Array.from(new Set(i.map(r=>a==="month"?r.MonthFormatted:r.Year)));e!=="AA-MM"?c.domain([e]):c.domain(L),$.call(d3.axisBottom(c).tickValues(c.domain().filter(function(r,m){return!(m%(a==="month"?3:1))}))).selectAll("text").attr("transform","rotate(-45)").style("text-anchor","end"),x.selectAll("rect").remove(),o.includes("Tout")&&(o=v),e!=="AA-MM"&&(t={...t,...Object.fromEntries(Object.entries(t).map(([r,m])=>[r,{[e]:m[e]}]))}),h=0,o.forEach(r=>{c.domain().forEach(m=>{h=Math.max(h,t[r][m]||0)})}),l.domain([h,0]),M(l,h,s,d),o.forEach(r=>{c.domain().forEach(m=>{x.append("rect").attr("x",c(m)).attr("y",T(r)).attr("width",c.bandwidth()).attr("height",T.bandwidth()).attr("rx",4).attr("ry",4).style("fill",l(t[r][m]||0)).style("stroke-width",2).style("stroke","#e2e8f0").style("opacity",.8).on("mouseover",function(O,H){const U=t[r][m]||0;B.transition().duration(200).style("opacity",.9),B.html(`Région: ${r}<br>Temps: ${m}<br>Requêtes: ${U}`).style("left",O.pageX+10+"px").style("top",O.pageY-28+"px")}).on("mouseout",function(O){B.transition().duration(500).style("opacity",0)})})}),M(l,h,s,d)};S(f,w,v,"AA-MM");const I=d3.select("#colorSelector").append("select").attr("class","p-2 border rounded-md"),q=[{name:"Cool",scale:d3.interpolateCool},{name:"Viridis",scale:d3.interpolateViridis},{name:"Inferno",scale:d3.interpolateInferno},{name:"Magma",scale:d3.interpolateMagma},{name:"Plasma",scale:d3.interpolatePlasma},{name:"Cividis",scale:d3.interpolateCividis}];q.forEach(t=>{I.append("option").attr("value",t.name).text(t.name)}),I.on("change",function(t){const a=q.find(o=>o.name===this.value);l=d3.scaleSequential(a.scale).domain([A,0]),S(f,d3.select("#timeSelector").property("value"),v,u.property("value")),M(l,h,s,d)});const b=40,D=g;s=d3.select("#legend").append("svg").attr("width",b+n.right).attr("height",g+n.top+n.bottom).append("g").attr("transform",`translate(10, ${n.top})`),d=d3.scaleLinear().domain([0,A]).range([D,0]);const G=d3.axisRight(d).ticks(20).tickFormat(d3.format(".0f"));k=s.append("defs").append("svg:linearGradient").attr("id","gradient").attr("x1","0%").attr("y1","100%").attr("x2","0%").attr("y2","0%").attr("spreadMethod","pad");function M(t,a,o,e){if(e){e.domain([0,a]),o.select(".axis").call(G),k.selectAll("stop").remove();for(let p=0;p<=100;p+=1)k.append("stop").attr("offset",`${p}%`).attr("stop-color",t(a*p/100))}}M(l,h,s,d),s.append("rect").attr("width",b).attr("height",D).style("fill","url(#gradient)"),s.append("g").attr("class","axis text-sm").attr("transform",`translate(${b}, 0)`).call(G),s.append("text").attr("x",b/2).attr("y",-10).attr("text-anchor","middle").attr("class","text-sm font-semibold text-gray-700").text("Requêtes"),y.append("option").attr("value","Tout").text("Tout"),y.selectAll(null).data(v).enter().append("option").attr("value",t=>t).text(t=>t);function j(t,a){const o=i.filter(e=>e.NB_REQST>t&&e.NB_REQST<=a);o.forEach(e=>{e.Region=C[e.ID_REGN_ADMIN]}),x.selectAll("rect").data(o,e=>`${e.Region}-${e.MonthFormatted}`).transition().duration(500).attr("fill",e=>l(e.NB_REQST))}const E=A/40;s.selectAll("rect.legend-step").data(d3.range(0,A,E)).enter().append("rect").attr("class","legend-step").attr("x",0).attr("y",t=>d(t+E)).attr("width",b).attr("height",t=>d(t)-d(t+E)).attr("fill",t=>l(t+E)).on("click",function(t,a){j(a,a+E)}),y.on("change",function(){const t=Array.from(this.selectedOptions,e=>e.value),a=R.property("value"),o=u.property("value");S(f,a,t,o)}),R.on("change",function(){const t=this.value;t==="year"&&u.property("value","AA-MM"),t==="month"&&u.property("value","AA-MM"),_=F(i,t),f=Q(_);const a=Array.from(y.node().selectedOptions,e=>e.value),o=u.property("value");Y(i,t),S(f,t,a,o),M(l,h,s,d)}),u.on("change",function(){const t=Array.from(y.node().selectedOptions,e=>e.value),a=R.property("value"),o=this.value;S(f,a,t,o),M(l,h,s,d)}),Y(i,w)});
