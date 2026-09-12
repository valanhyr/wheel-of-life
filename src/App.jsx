import React, {useEffect, useState, useRef} from "react";
import './index.css';

const ASPECTS = ['Salud','Carrera','Finanzas','Relaciones','Crecimiento','Ocio','Entorno','Espiritualidad'];

export default function App(){
  const [selfEval,setSelfEval] = useState(new Array(8).fill(0));
  const [questionsAvg,setQuestionsAvg] = useState(new Array(8).fill(0));
  const [questions, setQuestions] = useState([]);
  const [qIndex,setQIndex] = useState(0);
  const wheelRef = useRef(null);

  useEffect(()=>{ // seed demo questions minimal
    const mock = [];
    ASPECTS.forEach((a,ai)=>{
      for(let i=0;i<3;i++){
        mock.push({question_id:`${ai}-${i}`, area:a, dimension:`Dim ${i+1}`, text:`¿Cómo valoras ${a} pregunta ${i+1}?`, type:'valoracion'});
      }
    });
    setQuestions(mock);
  },[]);

  useEffect(()=>{
    drawWheel();
  },[selfEval,questionsAvg]);

  function drawWheel(){
    const container = wheelRef.current; if(!container) return;
    const size = container.clientWidth; container.innerHTML='';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS,'svg'); svg.setAttribute('viewBox',`0 0 ${size} ${size}`);
    const cx = size/2, cy=size/2, maxR = size/2 - 8;
    const rings = 10, aspects = ASPECTS.length;
    for(let r=rings;r>=1;r--){
      const radiusOuter=(r/rings)*maxR; const radiusInner=((r-1)/rings)*maxR;
      for(let a=0;a<aspects;a++){
        const start=(a/aspects)*Math.PI*2 - Math.PI/2; const end=((a+1)/aspects)*Math.PI*2 - Math.PI/2;
        const x1=cx+radiusInner*Math.cos(start), y1=cy+radiusInner*Math.sin(start);
        const x2=cx+radiusOuter*Math.cos(start), y2=cy+radiusOuter*Math.sin(start);
        const x3=cx+radiusOuter*Math.cos(end), y3=cy+radiusOuter*Math.sin(end);
        const x4=cx+radiusInner*Math.cos(end), y4=cy+radiusInner*Math.sin(end);
        const d = `M ${x1} ${y1} L ${x2} ${y2} A ${radiusOuter} ${radiusOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${radiusInner} ${radiusInner} 0 0 0 ${x1} ${y1}`;
        const path = document.createElementNS(svgNS,'path'); path.setAttribute('d',d);
        const filled = selfEval[a] >= r;
        const baseColor = getColorForAspect(a);
        path.setAttribute('fill', filled? baseColor : 'rgba(255,255,255,0.02)');
        path.setAttribute('stroke','rgba(255,255,255,0.04)'); path.setAttribute('stroke-width','0.5');
        svg.appendChild(path);
      }
    }
    // overlay polygon from questionsAvg
    if(questionsAvg && questionsAvg.length){
      const points = [];
      for(let a=0;a<ASPECTS.length;a++){
        const ratio = Math.max(0,Math.min(1,questionsAvg[a]/10)); const r = ratio*maxR;
        const angle = ((a+0.5)/ASPECTS.length)*Math.PI*2 - Math.PI/2;
        const px = cx + r*Math.cos(angle), py = cy + r*Math.sin(angle);
        points.push([px,py]);
        const c = document.createElementNS(svgNS,'circle'); c.setAttribute('cx',px); c.setAttribute('cy',py); c.setAttribute('r',4); c.setAttribute('fill',getColorForAspect(a)); c.setAttribute('opacity','0.95'); svg.appendChild(c);
      }
      const segs = points.map((p,i)=>(i===0?`M ${p[0]} ${p[1]}`:`L ${p[0]} ${p[1]}`)).join(' ') + ' Z';
      const poly = document.createElementNS(svgNS,'path'); poly.setAttribute('d',segs); poly.setAttribute('fill','none'); poly.setAttribute('stroke','rgba(255,255,255,0.18)'); poly.setAttribute('stroke-width','2'); poly.setAttribute('opacity','0.16'); svg.appendChild(poly);
    }
    container.appendChild(svg);
  }

  function getColorForAspect(i){
    const palette = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#10b981','#06b6d4','#6366f1'];
    return palette[i%palette.length];
  }

  function onRangeChange(i,v){ const copy=[...selfEval]; copy[i]=Number(v); setSelfEval(copy); }

  function submitAnswer(value){
    const q = questions[qIndex]; if(!q) return; const score = Number(value);
    const copy = [...questions]; copy[qIndex] = {...q, selected:value, score_0_10:score}; setQuestions(copy);
    // compute agg
    const map = {};
    copy.forEach(entry=>{ map[entry.area]=map[entry.area]||{sum:0,count:0}; const s=Number(entry.score_0_10)||0; map[entry.area].sum+=s; map[entry.area].count+=1; });
    const agg = ASPECTS.map(a=> map[a] && map[a].count? Math.round((map[a].sum/map[a].count)*100)/100 : 0);
    setQuestionsAvg(agg);
    if(qIndex < copy.length-1) setQIndex(qIndex+1);
  }

  return (
    <div className="app-root">
      <div className="container">
        <div className="left">
          <div className="header"><div>
            <div className="title">Rueda de la Vida</div>
            <div className="subtitle">Diagnóstico visual y acción</div>
          </div><div className="subtitle">Demo</div></div>

          <div className="wheel" ref={wheelRef} role="img" aria-label="Rueda de la vida"></div>

          <div className="legend-box">
            <div className="controls">
              <label className="legend">Autoevaluación rápida</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {ASPECTS.map((a,i)=> (
                  <div key={a} style={{display:'flex',flexDirection:'column',alignItems:'center',fontSize:12}}>
                    <input type="range" min="0" max="10" value={selfEval[i]} onChange={(e)=>onRangeChange(i,e.target.value)} />
                    <div style={{marginTop:6}} className="text-muted">{a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="toolbar"><button className="btn">Calcular</button><button className="btn ghost">Exportar</button></div>

          <div id="questionsForm">
            {questions.length===0? <div className="question-card">Cargando...</div> : (
              <div className="question-card">
                <div className="q-title">{questions[qIndex].area} — {questions[qIndex].dimension}</div>
                <div className="q-text">{questions[qIndex].text}</div>
                <div className="answers-card">
                  {[1,2,3,4,5,6,7,8,9,10].map(v=> (
                    <label key={v} style={{minWidth:36}}>
                      <input name="current" type="radio" value={v} onChange={(e)=>submitAnswer(e.target.value)} />
                      <div style={{padding:'6px 8px'}}>{v}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="results">
              {ASPECTS.map((a,i)=> (
                <div className="result-row" key={a}>
                  <div className="left"><div className="label">{a}</div><div className="meta">Auto: {selfEval[i]}/10</div></div>
                  <div><span className="badge" data-attention="default">{questionsAvg[i]}/10</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

