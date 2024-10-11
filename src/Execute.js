class Node {
    constructor(id, data){
        this.id = (id !== undefined) ? id : Number(new Date());
        this.info = data;
        this.children = [];
        this.parent = null;
        this.depth = 0;
    }

    getId(){return this.id;}
    getInfo(){return this.info;}
    getChildren(){return this.children;}
    getParent(){return this.parent;}
    getDepth(){return this.depth;}
    merge(key, val){
        this[key] = val;
        return this;
    }
    getPedigree(){
        const ret = [];
        const func = (e, ret) => {
            ret.push(e);
            ret.push(...e.getChildren().filter(e => !ret.includes(e)).reduce((a,e) => {
                if(e.getChildren().length > 0) {
                    func(e, ret);
                    return a;
                }
                else return [...a, e];
            }, []));
        }
        func(this, ret);
        return ret;
    }
    copy(){
        const ret = new Node(this.getId(), this.getInfo());
        const tree = new Tree(ret);
        const func = (CopyingNode, CopiedNode) => {
            CopyingNode.getChildren().forEach(e => {
                const addNode = new Node(e.getId(), e.getInfo());
                tree.addChild(CopiedNode, addNode);
                func(e, addNode);
            })
        }
        func(this, ret);
        return ret;
    }
}

class Tree {
    constructor(Root){
        this.Root = Root;
        this.nodes = [Root];
    }
    getRoot(){return this.Root;}
    getNodebyId(id){return this.nodes.find(e => e.getId() === id);}
    getNodes(){return this.nodes;}
    addChild(node1, node2){
        if(node1.getChildren().includes(node2)) {
             return 0;
        }
        this.nodes.push(node2);
        node2.merge("parent", node1);
        node2.merge("depth", node1.getDepth()+1);
        node1.merge("children", [...node1.getChildren(), node2]);
        return node2;
    }
    addChildatRoot(node) {
        node.depth = 1;
        node.parent = this.Root;
        this.Root.children.push(node);
        this.nodes.push(...node.getPedigree());

        return node;
    }

    removeChild(node1, node2){
        node2.parent = null;
        node2.depth = undefined;
        node1.children = node1.children.filter(e => e.getId() !== node2.getId());
        this.nodes = this.nodes.filter(e => e.getId() !== node2.getId())
    }

    exchangeChild(node1, node2){
        if(!(node1 instanceof Node && node2 instanceof Node)) return 0;
        if(node1.getParent() !== null) node1.getParent().merge('children', node1.getParent().getChildren().map((e,i,a) => {return i === a.indexOf(node1) ? node2 : e}));
        node2.merge('parent', node1.getParent());
        node2.getPedigree().forEach(e => e.merge('depth', e.getDepth() + node1.getDepth()))
        
        const deleting = node1.getPedigree();
        const adding = node2.getPedigree();
        if(node1 === this.getRoot()) this.Root = node2;

        this.nodes = this.nodes.filter(e => !deleting.includes(e)).concat(adding);

        return node2;
    }

    getMaxDepth(){return Math.max(this.getNodes().map(e => e.getDept()));}
    
    getLeafNodes(){return this.getNodes().filter(e => !e.getChildren().length)}
}

function Error (ErrMessage, interval, Return, Func){
    console.log(ErrMessage);
    Return.push(ErrMessage);
    Func(Return);
    clearInterval(interval);
}

export default function Execute (graph, blocks, Func) {

    const tempGraph = {...graph};
    for(let i of blocks) {
        tempGraph[i.id] = {
            type : i.type,
            isRooted : i.isRooted,
            input : i.input,
            link : [...graph[i.id]],
        };
    }
    const Nodes = Object.keys(tempGraph).map(e => new Node(e, tempGraph[e]))
    Nodes.forEach(e => (e.merge('info', {...e.getInfo(), code : []}) &&  e.getInfo().type === 'while') && e.merge('info', {...e.getInfo(), whiling : []}));
    const Roots = Nodes.filter(e => e.getInfo().isRooted);
    const ExecuteTrees = [];
    console.log(tempGraph);

    Roots.forEach(node => {
        const tree = new Tree(node);
        const func = (node) => {
            node.getInfo().link.forEach(E => {
                const ChildNode = Nodes.find(e => e.getId() === E);
                tree.addChild(node, ChildNode) && func(ChildNode);
            });
        }
        func(node);
        ExecuteTrees.push(tree);
    })

    const ScheduleQueue = ExecuteTrees.map(e => e.getRoot());
    const TaskHistory = [];
    const Variable = {};
    const Return = [];
    
    console.log(ScheduleQueue.map(e => e.getPedigree()));

    const interval = setInterval(() => {
        if(ScheduleQueue.length > 0){
            console.log('\n\n\n')
            console.log(ScheduleQueue.map(e => e.copy().getInfo()));
            const Executing = ScheduleQueue.shift();
            TaskHistory.push(Executing);

            //Task
            const { input, type, code } = Executing.getInfo();
            console.log(Executing.getInfo());
            switch(type){
                case "while" : 
                    var innerVal = input.expression.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) !== null ? input.expression.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) : [];
        
                    if(innerVal.some(e => !Object.keys(Variable).includes(e))){
                        Error("Syntax Error : Undefined Variable is Included", interval, Return, Func);
                    }
                    else {
                        try {
                            const exp = input.expression.split(/[a-zA-Z_][a-zA-Z_0-9]*/).map((e, i) => i !== innerVal.length ? e + Variable[innerVal[i]].value : e).join("");
                            const bool = Boolean(new Function("return "+exp)());
                            if(bool) {
                                const Code = Executing.getId() +'/'+ Executing.getInfo().whiling.push('w');
                                const adding = Executing.getChildren().filter(e => e.getInfo().type !== 'else').map(e => e.copy()).map((e) => {e.getPedigree().forEach(e => !e.getInfo().code.map(e => e.code).includes(Code) && e.getInfo().code.push({code : Code, node : Executing})); return e;});

                                ScheduleQueue.push(...adding);
                            }
                            else {
                                ScheduleQueue.push(...Executing.getChildren().filter(e => e.getInfo().type === 'else'));
                            }
                        }
                        catch(e){
                            Error("Syntax Error : Invalid Expression", interval, Return, Func);
                        }
                    }
                    break;

                case "else" :
                    ScheduleQueue.push(...Executing.getChildren());
                    break;

                case "if" :
                    var innerVal = input.expression.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) !== null ? input.expression.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) : [];
    
                    if(innerVal.some(e => !Object.keys(Variable).includes(e))){
                        console.log("Syntax Error : Undefined Variable is Included");
                        console.log(innerVal);
                        Error("Syntax Error : Undefined Variable is Included", interval, Return, Func);
                    }
                    else {
                        try {
                            const exp = input.expression.split(/[a-zA-Z_][a-zA-Z_0-9]*/).map((e, i) => i !== innerVal.length ? e + Variable[innerVal[i]].value : e).join("");
                            console.log(exp);
                            const bool = Boolean(new Function("return "+exp)());
                            if(bool) {
                                ScheduleQueue.push(...Executing.getChildren().filter(e => e.getInfo().type !== "else"));
                            }
                            else {
                                ScheduleQueue.push(...Executing.getChildren().filter(e => e.getInfo().type === "else"));
                            }
                        }
                        catch(e){
                            console.log(e);
                            console.log("Syntax Error : Invalid Expression");
                            Error("Syntax Error : Invalid Expression", interval, Return, Func);
                        }
                    }
                    break;

                case "init" :
                    if(input.name && input.name.match(/[a-zA-Z0-9_][a-zA-Z0-9_]*/) === null){
                        console.log("Syntax Error : Invalid Name Variable is defined");
                        Error("Syntax Error : Invalid Name Variable is defined", interval, Return, Func);
                        break;
                    }
                    
                    switch(input.type) {
                        case "number" : 
                            const innerVal = input.value.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) !== null ? input.value.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) : [];
                            if(innerVal.some(e => !Object.keys(Variable).includes(e))){
                                console.log("Syntax Error : Undefined Variable is Included");
                                console.log(innerVal);
                                Error("Syntax Error : Undefined Variable is Included", interval, Return, Func);
                            }
                            else if(innerVal.some(e => Variable[e].type !== "number")){
                                console.log("Runtime Error : Number Variable cannot be defined with String");
                                Error("Runtime Error : Number Variable cannot be defined with String", interval, Return, Func);
                            }
                            else {
                                const val = input.value.split(/[a-zA-Z_][a-zA-Z_0-9]*/).map((e, i) => i !== innerVal.length ? e + Variable[innerVal[i]].value : e).join("");
                                //console.log(val);
                                try{
                                    Variable[input.name.trim()] = {type : "number", value : new Function("return "+val)()};
                                    console.log(input.name.trim(), ":", Variable[input.name.trim()]);
                                }
                                catch {
                                    console.log("Syntax Error : Invalid Expression");
                                    Error("Syntax Error : Invalid Expression", interval, Return, Func);
                                }
                            }
                            break;

                        case "string" : 
                            const strings = input.expression && input.expression.match(/"[^"]*"/g) ? input.expression.match(/"[^"]*"/g) : [];
                            const exp = (() => {let i=input.value ? input.value : "";strings.forEach(e=>{i=i.replace(e,"")});return i;})().split(",").map(e => e.trim() === "" ? strings.splice(0, 1)[0] : e.trim());
                            console.log(exp, strings);
                            if(strings.length > 0 || exp.includes(undefined)) console.log("Syntax Error : Unexpected Expression with '\"'");
                            else if(exp.filter(e => e.match(/"/) === null).some(e => !Object.keys(Variable).includes(e))){
                                Error("Syntax Error : Undefined Variable is Included", interval, Return, Func);
                            }
                            else {
                                Variable[input.name.trim()] = {type : "string", value : input.value};
                            }
                            break;

                        default : 
                            Error("Syntax Error : Invalid Type defined", interval, Return, Func);
                            break;
                    }
                    ScheduleQueue.push(...Executing.getChildren());
                    break;

                case "print":
                    const strings = input.expression && input.expression.match(/"[^"]*"/g) ? input.expression.match(/"[^"]*"/g) : [];
                    const exp = (() => {let i=input.expression ? input.expression : "";strings.forEach(e=>{i=i.replace(e,"")});return i;})().split(",").map(e => e.trim() === "" ? strings.splice(0, 1)[0] : e.trim());
                    if(strings.length > 0 || exp.includes(undefined)) {
                        Error("Syntax Error : Unexpected Expression with '\"'", interval, Return, Func);
                    }
                    else if(exp.filter(e => e.match(/"/) === null).some(e => !Object.keys(Variable).includes(e))){
                        Error("Syntax Error : Undefined Variable is Included", interval, Return, Func);
                    }
                    else {
                        const print = exp.map(e => e.match(/"/) === null ? Variable[e].value : e.slice(1, e.length-1)).join("");
                        Return.push(print);
                    }
                    ScheduleQueue.push(...Executing.getChildren());
                    break;
                
                case "buffer" :
                    ScheduleQueue.push(...Executing.getChildren());
                    break;

                default :
                    Error("Syntax Error : Unknown Block is Enabled", interval, Return, Func);
                    break;
            }

            code.length > 0 && code.map(e => e.code).some(Code => ScheduleQueue.every(e => !e.getInfo().code.map(e => e.code).includes(Code)))
                && (() => {
                    const willAdd = [];
                    code.forEach(Code => ScheduleQueue.every(e => !e.getInfo().code.map(e => e.code).includes(Code.code)) && willAdd.push(Code));
                    ScheduleQueue.unshift(...willAdd.filter((e,i,k) => k.slice(i+1).every(E => E.code.includes(e.code))).map(e => e.node));
                })()
        }
        else {
            clearInterval(interval);
        }
        Func(Return);
    }, 50);

    return Return;
}