import {useState, useEffect, useRef} from 'react';
import Draggable from 'react-draggable';
import BTI from "./BlockTypeInfo.json";

export default function Block(props){
    const { style, className, id, tag, blockInfo, func} = props;
    const { type, isRooted } = blockInfo;
    const [ linking, changing ] = func;
    const nodeRef = useRef(null);
    const [ upLayer, setUpLayer ] = useState(1);
    const [ width, setWidth ] = useState(100);

    useEffect(() => {
        setWidth(Object.keys(BTI).includes(type) ? BTI[type].width : 100);
    }, []);
        
    return (
        <Draggable nodeRef={nodeRef} onDrag={() => {setUpLayer(2)}} onStop={() => {setUpLayer(1)}}>
            <div ref = {nodeRef} className={className} id = {id} tag = {tag}
            style={{...style, borderRadius : isRooted ? "25px 0 0 0" : "", width : width + "px", position : "absolute", zIndex : `${upLayer}`}}
            onDoubleClick = {(e) => linking(id)}
            >
                <div className = "text" style={{color : "white"}}>
                    { Object.keys(BTI).includes(type) ? BTI[type].text : !Number.isNaN(Number(type)) ? type : "None"}
                    <button className="isRoot" onClick={() => {
                        const ret = {...blockInfo};
                        ret.isRooted = !ret.isRooted;
                        changing(ret);
                        }}/>
                    <div className="inputs">
                        { Object.keys(BTI).includes(type) ? 
                            Array(BTI[type].inputCount).fill(0).map((e, i) => {
                                return (
                                <input key={`input${id}/${i}`} className = "blockInput"
                                onChange = {(e) => {
                                    const ret = {...blockInfo};
                                    ret.input[BTI[type].inputType[i]] = e.target.value;
                                    changing(ret);
                                    }}
                                />
                                )
                            })
                        : ""
                        }                
                    </div> 

                </div>
                <div className = "link" id={`link${id}`} style={{backgroundColor : style.backgroundColor}}/>
            </div>
        </Draggable>
        )
}