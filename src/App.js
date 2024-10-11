import { useState, useEffect, useRef, useCallback } from 'react';
import Block from './Block.js';
import Xarrows, {Xwrapper} from 'react-xarrows';
import useMousePosition from './MousePosition.js';
import Execute from "./Execute.js";
import './App.css';

function App() {
  const mousePosition = useMousePosition();
  const [blocks, setBlocks] = useState([]);
  const [select, setSelect] = useState({last : null, now : null});
  const [linkPairs, setLinkPairs] = useState([]);
  const [nowLink, setNowLink] = useState(false);
  const [genType, setGenType] = useState("");
  const [Graph, setGraph] = useState({});
  const [Console, setConsole] = useState([]);

  const generateBlock = (isRooted = false) => {
    if(blocks.length > 50) return;
    const id =  Number(new Date()).toString(36);
    setGraph(() => {const ret = {...Graph}; ret[id] = []; return ret;})
    setBlocks(() => [...blocks, 
      {color : Array(3).fill(0).map(_ => {const k = Math.floor(Math.random() * 255).toString(16);return k.length > 1 ? k : `0${k}`;}).join(''), 
      type : genType, 
      id : id,
      input : {},
      isRooted : isRooted,
    }]);
  };

  const Linking = () => {
    const func1 = (e) => { console.log(e); setSelect( {...select, last : select.now, now : e} );};
    const func2 = (e) => { console.log(e); setBlocks([...blocks].map(E => E.id === e.id ? e : E))};
    return [func1, func2];
  };

  const readytoSetConsole = useCallback(e => {
    setConsole([...Console, ...e]);
  }, [Console]);

  const execute = () => { const exct = Execute(Graph, blocks, (e) => {readytoSetConsole(e)}); console.log(exct);};

  useEffect(() => {
    const a = select.now === null;
    const b = select.now === select.last;
    if(a || b) {
      b && !a &&setSelect({now : null, last : null}); setNowLink(false);
      return;
    }

    if(select.last === null) setNowLink(true);
    else {
      setGraph(() => {
        const ret = {...Graph};
        ret[select.last].push(select.now);
        return ret;
      });
      setLinkPairs([...linkPairs, select]);
      setSelect({now : null, last : null});
      setNowLink(false);
    }
  }, [select]);

  return (
    <div className="App" style={{flexDirection : window.innerWidth > 600 ? "row" : "column"}}>
      <div className="blockField" style={{width : "100%", height  : "100%", position : "relative"}}>
        <div style={{width : "100%", height : "80px"}}></div>
        <Xwrapper>
          <div className="GenerateBlock">
            <input className="genInput" onChange={e=> setGenType(e.target.value)} onKeyDown={e => {e.key === 'Enter' && generateBlock(e.ctrlKey)}}/>
            <button className="genBtn" onClick={e => generateBlock(false)}> Generate </button>
            <button className="start" onClick = {execute} > Start </button>
            <button className="genBtn" onClick={e => {}}> Manual </button>
          </div>
          
          {blocks.map((e,i) => <Block key={i} id={e.id} className="temp" 
            style={{margin : "1px 1px 1px 1px", backgroundColor : `#${e.color}`}}
            blockInfo = {e}
            func = {Linking(e.id)}
            />)
          }

          {nowLink && 
          <>
            <div id="tempLinker" style={{position : "absolute", top : mousePosition.y+5, left : mousePosition.x}}></div>
            <Xarrows onClick = {() => {console.log(1)}} startAnchor={"bottom"} headSize={4} start={`${select.now}`} end="tempLinker"/>
          </>
          }

          {linkPairs.map((e, i) => {
              const label = (Graph[e.last].indexOf(e.now)+1).toString();
              return (
                <Xarrows key={i} labels = {<div style={{color : "white", textShadow:"#000000 1.5px 1.5px, #000000 -1px -1px ", fontSize : "30px"}}>{label}</div>}zIndex = {0} startAnchor={"auto"} start={`link${e.last}`} end={`${e.now}`} />
              )
            })}

        </Xwrapper>
      </div>
      
      <div className="printField" style={{height : window.innerWidth > 600 ? "100%" : "30%", width : window.innerWidth > 600 ? "400px" : "100%"}}>
        <div className="Console" onDoubleClick={() => {setConsole([])}}> Console </div>
        <div className="Print">
          {Console.map((e,i) => <div className="log" key={i}>{e}</div>)}
        </div>
      </div>
    </div>
  );
}

export default App;