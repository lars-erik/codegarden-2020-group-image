import { createBubble } from "./bubbles";

const scale = 512;
let cvs2 = document.getElementsByTagName("canvas")[0];
cvs2.height = cvs2.width = scale;
cvs2.style.height = cvs2.style.width = scale + "px";
let ctx2 = cvs2.getContext("2d");

function render() {
    let img = createBubble("Your latest work", "was really", "awesome!");
    ctx2.drawImage(img, 0, 0);

    requestAnimationFrame(render);
}

render();


