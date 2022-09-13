PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.STRICT_TEXTURE_CACHE;
const button = document.getElementById("myBtn");
const musicBtn = document.getElementById("playMusic");
//Aliases
const gifDiv = document.getElementById("face");
const TextureCache = PIXI.utils.TextureCache;
const Rectangle = PIXI.Rectangle;
const Application = PIXI.Application,
  loader = PIXI.Loader.shared,
  resources = PIXI.Loader.shared.resources,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle;
// let Texture;

new PIXI.Loader()
  .add("unknown", "this/url/does/not/exist.png")
  .load((loader, resources) => {
    console.log("error", resources.unknown.error);
    console.log("texture.valid:", resources.unknown.texture.valid);
    console.log(
      "baseTexture.valid:",
      resources.unknown.texture.baseTexture.valid
    );
    console.log(
      "baseTexture.width:",
      resources.unknown.texture.baseTexture.width
    );
    console.log(
      "baseTexture.height:",
      resources.unknown.texture.baseTexture.height
    );
    console.log("TextureCache", PIXI.utils.TextureCache);
  });

// let dungeon, explorer, treasure, door, id, cat, state;
let id,
  state,
  enemy,
  arrOfEnemies,
  rocket,
  explosion,
  healthBar,
  message,
  createEnemies;
let w = 65;
  let h = 65;
let scoreboard = 0;
let flag = false;
let keys = {};
let keysDiv = document.querySelector("#keys");
let bullet;
let bullets = [];
let rockets = [];
let bulletSpeed = 10;
let playerSheet = {};
let explosionSheet = {};
let player;
let speed = 5;
let rocketSpeed = 25;
//background
let bgBack;
let bgMiddle;
let bgFront;
let bgx = 0;
let bgSpeed = 0.5;
let newEnemy;
// let explosionTextures = [];
// Collision

function testForAABB(object1, object2) {
  const bounds1 = object1.getBounds();
  const bounds2 = object2.getBounds();

  return (
    bounds1.x < bounds2.x + bounds2.width &&
    bounds1.x + bounds1.width > bounds2.x &&
    bounds1.y < bounds2.y + bounds2.height &&
    bounds1.y + bounds1.height > bounds2.y
  );
}

//Create a Pixi Application
const app = new Application({
  width: 512,
  height: 512,
  antialias: true,
  transparent: false,
  resolution: 1,
});

//Add the canvas that Pixi automatically created for you to the HTML document
// document.body.appendChild(app.view);
document.querySelector("#gameDiv").appendChild(app.view);

PIXI.Loader.shared.onProgress.add(loadProgressHandler);
//load an image and run the `setup` function when it's done FROM DOCS !!!!
// loader;
app.loader.baseUrl = "paralax";
app.loader.onComplete.add(initLevel);

app.loader
  .add("laser", "laser.png")
  .add("spaceship", "spaceship.png")
  .add("viking", "viking2.png")
  // .add("explosions", "explosions.png", { crossOrigin: true })
  .add("explosions", "explosions.png")
  .add("bgBack", "back-trees.png")
  .add("bgMiddle", "forest-middle-trees.png")
  .add("lights", "forest-lights.png")
  .add("bgFront", "front-trees.png")
  .add("spaceBG", "parallax-space-backgound.png")
  .add("bigPlanet", "parallax-space-big-planet.png")
  .add("smallPlanet", "parallax-space-far-planets.png")
  .add("ringPlanet", "parallax-space-ring-planet.png")
  .add("stars", "parallax-space-stars.png")
  .add("enemyRocket", "enemyRocket.png")
  .add("boom", "boom.png")
  .add("spritesheet", "explosions.json")
  .load(setup);
// app.loader.onComplete.add(createExplosion);
function loadProgressHandler(loader, resource) {
  //Display the file `url` currently being loaded
  console.log("loading: " + resource.url);

  //Display the percentage of files currently loaded
  console.log("progress: " + loader.progress + "%");
  console.log(resource.data);
  console.log("error: " + resource.error);
}

//This `setup` function will run when the image has loaded
function setup() {
  // console.log(app.width);
  // createEnemies = setInterval(createEnemy, 5000);
  // BEGIN
  // playMusic();
  createPlayerSheet();
  createPlayer();
  // createExplosion();
  state = playGame;
  //Create the health bar
  healthBar = new PIXI.Container();
  healthBar.position.set(0, 500);
  app.stage.addChild(healthBar);

  //Create the black background rectangle
  const innerBar = new PIXI.Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 512, 15);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  //Create the front red rectangle
  const outerBar = new PIXI.Graphics();
  outerBar.beginFill(0xfd3125);
  outerBar.drawRect(0, 0, 512, 15);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;

  //Create the text sprite and add it to the `gameOver` scene
  const style = new TextStyle({
    fontFamily: "EightBit Atari-90",
    fontSize: 34,
    fill: "white",
  });
  message = new Text("The End!", style);
  message.x = 130;
  message.y = 200;
  message.visible = false;
  app.stage.addChild(message);
  //Render the stage
  app.renderer.render(app.stage);
  app.ticker.add((delta) => gameLoop(delta));
  console.log("All files loaded");
}

function gameLoop(delta) {
  enemyMove();

  updateBG();
  state(delta);
}

//The `randomInt` helper function
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playGame(delta) {
  keyboard();
  shootBullets();
  contain(player, { x: 20, y: 20, width: 555, height: 555 });
  shootRockets();
  switchFaces();
  if (healthBar.outer.width < 0) {
    const death = document.getElementById("death");
    death.play();
    clearInterval(createEnemies);
    state = end;
    message.text = "You lost!";
    message.visible = true;
  }
}

// Enemy setup
arrOfEnemies = [];

function createEnemy() {
  // console.log(new Date());
  newEnemy = new PIXI.Sprite.from("images/enemy.png");
  let hello = "hello";

  newEnemy.scale.set(0.7, 0.7);
  newEnemy.anchor.set(0.5);

  newEnemy.x = randomInt(59 / 2, 512 - 29);

  newEnemy.y = -15;
  app.stage.addChild(newEnemy);
  arrOfEnemies.push(newEnemy);
  const enemySpotted = document.getElementById("enemySpotted");
  const underAttack = document.getElementById("underAttack");
  const underAttackDramatic = document.getElementById("underAttackDramatic");
  const ekhem = document.getElementById("ekhem");
  const haha = document.getElementById("haha");
  const arrOfSounds = [enemySpotted, underAttack, underAttackDramatic];
  const soundRandom = randomInt(0, arrOfSounds.length - 1);
  console.log(soundRandom);
  arrOfSounds[soundRandom].play();
  // if (healthBar.outer.width > 0) {
  // }
  // enemySpotted.play();
  return newEnemy;
}

function enemyMove() {
  for (let i = 0; i < arrOfEnemies.length; i++) {
    arrOfEnemies[i].y += 2;

    if (arrOfEnemies[i].position.y === 11) {
      arrOfEnemies[i].position.y === 11;
      flag = true;
      console.log(`y=20`);
      fireRocket();
    }
  }
}
async function explosionAnimation() {
  let sshetBoom = await new PIXI.BaseTexture.from(
    app.loader.resources["explosions"].url
  );
  // let sshetBoom = await t.load(app.loader.resources["explosions"].url);
  // let sshetBoom = new PIXI.BaseTexture.from("images/explosions.png");
  // let sshetBoom = new Sprite.from("images/explosions.png");
  let w = 160;
  let h = 160;
  let numFrames = 7;
  explosionSheet["one"] = [
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(1 * w, 0, w, h)),
    // new PIXI.Texture(sshetBoom, new PIXI.Rectangle(0 * w, 0, w, h)),
  ];
  explosionSheet["boom"] = [
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(0 * w, 0, w, h)),
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(1 * w, 0, w, h)),
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(2 * w, 0, w, h)),
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(3 * w, 0, w, h)),
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(4 * w, 0, w, h)),
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(5 * w, h, w, h)),
    new PIXI.Texture(sshetBoom, new PIXI.Rectangle(6 * w, h, w, h)),
  ];
}

function createExplosion() {
  explosion = new PIXI.AnimatedSprite(explosionSheet);

  explosion.animationSpeed = 0.1;
  explosion.loop = false;
  explosion.anchor.set(0.5);
  explosion.x = 222;
  explosion.y = 222;

  app.stage.addChild(explosion);
}

function createPlayerSheet() {
  let sshet = new PIXI.BaseTexture.from(app.loader.resources["spaceship"].url);
  
  let numFrames = 12;

  playerSheet["standSouth"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(1 * w, 0, w, h)),
  ];
  playerSheet["standWest"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(4 * w, 0, w, h)),
  ];
  playerSheet["standEast"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(7 * w, 0, w, h)),
  ];
  playerSheet["standNorth"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(10 * w, 0, w, h)),
  ];

  playerSheet["walkSouth"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(0 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(1 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(2 * w, 0, w, h)),
  ];
  playerSheet["walkWest"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(3 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(4 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(5 * w, 0, w, h)),
  ];
  playerSheet["walkEast"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(6 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(7 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(8 * w, 0, w, h)),
  ];
  playerSheet["walkNorth"] = [
    new PIXI.Texture(sshet, new PIXI.Rectangle(9 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(10 * w, 0, w, h)),
    new PIXI.Texture(sshet, new PIXI.Rectangle(11 * w, 0, w, h)),
  ];
}

function createPlayer() {
  player = new PIXI.AnimatedSprite(playerSheet.standSouth);

  player.animationSpeed = 0.1;
  player.loop = false;
  player.anchor.set(0.5);
  player.x = app.view.width / 2;
  player.y = 444;

  app.stage.addChild(player);
  player.zIndex = 11;
  player.play();
}

//The `keyboard` helper function
function keyboard(keyCode) {
  // keysDiv.innerHTML = JSON.stringify(keys);
  if (keys["87"]) {
    if (!player.playing) {
      player.textures = playerSheet.walkNorth;
      player.play();
    }
    player.y -= speed;
  }
  if (keys["83"]) {
    if (!player.playing) {
      player.textures = playerSheet.walkSouth;
      player.play();
    }
    player.y += speed;
  }
  if (keys["65"]) {
    if (!player.playing) {
      player.textures = playerSheet.walkWest;
      player.play();
    }
    player.x -= speed;
  }
  if (keys["68"]) {
    if (!player.playing) {
      player.textures = playerSheet.walkEast;
      player.play();
    }
    player.x += speed;
  }

  window.addEventListener("keydown", keysDown);
  window.addEventListener("keyup", keysUp);
  return keys;
}

// Key functions
const keysDown = (e) => {
  console.log(e.keyCode);
  keys[e.keyCode] = true;
};

const keysUp = (e) => {
  console.log(e.keyCode);
  keys[e.keyCode] = false;
};

// Paralax Background
function initLevel() {
  bgBack = createBg(app.loader.resources["spaceBG"].texture);
  bgMiddle = createBg(app.loader.resources["stars"].texture);
  bgFront = createBg(app.loader.resources["smallPlanet"].texture);
}
function createBg(texture) {
  let tiling = new PIXI.TilingSprite(texture, 800, 600);
  // tiling.scale.set(3.85, 3.85);
  tiling.scale.set(5, 5);

  // tiling.anchor.set(0.5);
  tiling.position.set(0, 0);
  tiling.x = 800;
  tiling.rotation = 1.57;
  app.stage.addChild(tiling);

  return tiling;
}
function updateBG() {
  bgx = bgx + bgSpeed;
  bgFront.tilePosition.x = bgx;
  bgMiddle.tilePosition.x = bgx / 2;
  bgBack.tilePosition.x = bgx / 4;
}

// Shooting enemy
const createEnemyRocket = () => {
  rocket = new PIXI.Sprite.from("paralax/enemyRocket.png");
  rocket.anchor.set(0.5);
  rocket.scale.set(0.7, 0.7);
  rocket.x = newEnemy.x;
  rocket.y = 11;
  rocket.speed = bulletSpeed;
  app.stage.addChild(rocket);

  console.log(`rocket y- ${rocket.y}`);
  return rocket;
};
const fireRocket = () => {
  let rocket = createEnemyRocket();

  rockets.push(rocket);
  console.log(`array rockets: ${rockets.length}`);
  console.log(`array rockets Y: ${rockets[0].y}`);
  console.log(`rocket y- ${rocket.y}`);
};
function shootRockets(delta) {
  for (let i = 0; i < rockets.length; i++) {
    // rockets[i].position.y += rockets[i].rocketSpeed;
    rockets[i].position.y += 5;
    if (rockets[i].position.y > 512) {
      rockets[i].dead = true;
    }
  }
  for (let i = 0; i < rockets.length; i++) {
    if (rockets[i].dead) {
      app.stage.removeChild(rockets[i]);
      rockets.splice(i, 1);
    }
  }
  for (let i = 0; i < rockets.length; i++) {
    if (testForAABB(player, rockets[i])) {
      player.alpha = 0.5;
      healthBar.outer.width -= 7;
    } else {
      player.alpha = 1;
    }
  }
}

// Shooting Player
const createBullet = () => {
  bullet = new PIXI.Sprite.from("images/laser.png");
  bullet.scale.set(0.1, 0.1);
  bullet.rotation = 300;
  bullet.anchor.set(0.5);
  bullet.x = player.x;
  bullet.y = player.y;
  bullet.speed = bulletSpeed;
  app.stage.addChild(bullet);

  return bullet;
};

const fireBullet = (e) => {
  console.log("e");
  console.log(bullets);
  let bullet = createBullet();
  bullets.push(bullet);
  // switchFaces();
};

function shootBullets(delta) {
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].position.y -= bullets[i].speed;

    if (bullets[i].position.y < 0) {
      bullets[i].dead = true;
    }
  }
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].dead) {
      app.stage.removeChild(bullets[i]);
      bullets.splice(i, 1);
    }
  }
  for (let i = 0; i < arrOfEnemies.length; i++) {
    if (arrOfEnemies[i].dead) {
      app.stage.removeChild(arrOfEnemies[i]);
      arrOfEnemies.splice(i, 1);
    }
  }
  if (newEnemy) {
    for (let j = 0; j < arrOfEnemies.length; j++) {
      for (let i = 0; i < bullets.length; i++) {
        if (testForAABB(bullets[i], arrOfEnemies[j])) {
          // console.log("lolz");
          const index = arrOfEnemies.indexOf(j);
          const index2 = arrOfEnemies[j];
          // bullets[i].dead = true;
          // console.log(index);
          // console.log(index2);
          // console.log(arrOfEnemies);
          arrOfEnemies[j].dead = true;
          const explosionTextures = [];
          let k;
          // explosion = new PIXI.Sprite.from("paralax/boom.png");
          for (k = 0; k < 8; k++) {
            const texture = PIXI.Texture.from(`explosions${k + 1}.png`);
            explosionTextures.push(texture);
          }
          const explosion = new PIXI.AnimatedSprite(explosionTextures);

          explosion.x = arrOfEnemies[j].x;
          explosion.y = arrOfEnemies[j].y;
          explosion.anchor.set(0.5);
          explosion.rotation = Math.random() * Math.PI;
          explosion.scale.set(0.75 + Math.random() * 0.5);
          explosion.animationSpeed = 0.3;
          explosion.loop = false;
          explosion.play();
          app.stage.addChild(explosion);
          scoreboard += 1;
          keysDiv.innerHTML = `Scoreboard ${scoreboard}`;
        }
      }
    }
  }
}
function contain(sprite, container) {
  let collision = undefined;

  //Left
  if (sprite.x < container.x) {
    sprite.x = container.x;
    collision = "left";
  }

  //Top
  if (sprite.y < container.y) {
    sprite.y = container.y;
    collision = "top";
  }

  //Right
  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision = "right";
  }

  //Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision = "bottom";
  }

  //Return the `collision` value
  return collision;
}
function end() {
  for (let j = 0; j < arrOfEnemies.length; j++) {
    arrOfEnemies[j].dead = true;
    app.stage.removeChild(arrOfEnemies[j]);
  }
  for (let i = 0; i < rockets.length; i++) {
    rockets[i].dead = true;
  }
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].dead = true;
  }
  app.ticker.stop();

  // app.stage.visible = false;
  // gameOverScene.visible = true;
}
function startGame() {
  scoreboard = 0;
  // for (let j = 0; j < arrOfEnemies.length; j++) {
  //   arrOfEnemies[j].dead = true;
  // }
  // for (let i = 0; i < rockets.length; i++) {
  //   rockets[i].dead = true;
  // }
  // for (let i = 0; i < bullets.length; i++) {
  //   bullets[i].dead = true;
  // }
  player.alpha = 1;
  arrOfEnemies.length = 0;
  arrOfEnemies.length = 0;
  console.log(arrOfEnemies.length);
  console.log(rockets.length);
  console.log("started game");
  keysDiv.innerHTML = `Scoreboard ${scoreboard}`;
  // scoreboard = 0;
  healthBar.outer.width = 512;
  state = playGame;
  app.ticker.start();
  message.visible = false;
  player.x = app.view.width / 2;
  player.y = 444;
  gifDiv.classList.remove("dead");
  gifDiv.classList.add("face");
  createEnemies = setInterval(createEnemy, 5000);
}
function playMusic() {
  console.log("music");
  const musicSound = document.getElementById("chadOst");
  // const musicSound = document.getElementById("space");
  // console.log(audioSound);
  musicSound.loop = true;
  musicSound.volume = 0.5;
  // musicSound.muted = true;
  musicSound.muted = false;
  musicSound.play();
}
function switchFaces() {
  // gifDiv.classList.toggle("faceAngry");
  if (healthBar.outer.width < 0) {
    gifDiv.classList.remove("face");
    gifDiv.classList.remove("faceAngry");
    gifDiv.classList.add("dead");
  } else {
    if (gifDiv.classList.contains("face") && arrOfEnemies.length > 0) {
      gifDiv.classList.remove("face");
      gifDiv.classList.add("faceAngry");
    } else if (
      gifDiv.classList.contains("faceAngry") &&
      arrOfEnemies.length === 0
    ) {
      gifDiv.classList.remove("faceAngry");
      gifDiv.classList.add("face");
    }
  }
}
window.addEventListener("pointerdown", fireBullet);
// window.addEventListener("pointerdown", switchFaces);
button.addEventListener("click", startGame);
musicBtn.addEventListener("click", playMusic);
