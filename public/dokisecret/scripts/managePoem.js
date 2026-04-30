import { mainScreen } from "./dialogos.js"
import {cargarSonido} from "./cargarSonido.js"

class Poem {
    constructor() {
        this.domPoem = document.createElement("div")
        this.domPoem.classList.add("poem-bg")
    }
}
const paperSound = cargarSonido("/dokisecret/api/sound/sfx/hover-sound")

let poem = new Poem()

export function managePoem(poemObj){
    if(poemObj !== "quit"){
        
        poem.domPoem.innerHTML = `${poemObj.title}</br></br>${poemObj.content}`;
        poem.domPoem.classList.add("poem-" + poemObj.char)
        mainScreen.appendChild(poem.domPoem)
        paperSound.play()
    }
    else {
        poem.domPoem.classList.remove(poem.domPoem.classList[1])
        mainScreen.removeChild(poem.domPoem)
    }
}
