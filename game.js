window.onload = function(){
    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    world = new CANNON.World()
    world.gravity.set(0,-80,0)
    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(0xffffff)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.zindex = -100
    document.body.appendChild(renderer.domElement)
    renderer.domElement.addEventListener('click',function(){
        renderer.domElement.requestPointerLock()
    })
    document.addEventListener('pointerlockchange', lockChangeAlert, false)
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false)

    function lockChangeAlert(){
        if (document.pointerLockElement === renderer.domElement ||
            document.mozPointerLockElement === renderer.domElement){
            console.log('The pointer lock status is now locked')
            document.addEventListener("mousemove", updatePosition, false)
        }else{
            console.log('The pointer lock status is now unlocked')
            document.removeEventListener("mousemove", updatePosition, false)
        }
    }
    
    function updatePosition(e) {
        mouse.x += e.movementX
        mouse.y += e.movementY
        mouse.dX = e.movementX
        mouse.dY = e.movementY
    }
    
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0,10,10)
    mouse = new THREE.Vector2()
    mouse.dX = 0
    mouse.dY = 0
    camera.update = function(){
        //camera.lookAt(player.position)
    }
    scene.add(camera)
    resize = function(e){
        e.preventDefault()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.domElement.style.left = 0
        renderer.domElement.style.top = 0
        window.scrollTo(0,0)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }
    window.addEventListener('resize',resize)
    window.dispatchEvent(new Event('resize'))
    player = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({color:0xdddddd})
    )
    player.speed = 20
    scene.add(player)
    
    ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(10,10),
            new THREE.MeshLambertMaterial({color:0xffdddd})
    )
    ground.material.side = THREE.DoubleSide
    ground.rotation.x = Math.PI*-0.5
    scene.add(ground)
    
    orbit = new THREE.OrbitControls(camera)
    skyLight = new THREE.DirectionalLight(0xffffff, 1)
    skyLight.position.set(1,2,1)
    scene.add(skyLight)
    ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    floorLight = new THREE.DirectionalLight(0xffffff, 0.1)
    floorLight.position.set(0,-1,0)
    scene.add(floorLight)
    
    document.addEventListener('keydown',function(e){
        e.preventDefault()
        e = e || window.event
        e = e.which || e.keyCode
        switch(e){
            case 65:
                var temp = camera.clone()
                //temp.rotation.x = 0
                temp.position.sub(player.position)
                temp.position.y=0
                temp.position.normalize()
                var temp2 = new THREE.Vector3(temp.position.z,0,-1*temp.position.x)
                player.position.sub(temp2)
                camera.position.sub(temp2)
                break
            case 68:
                var temp = camera.clone()
                //temp.rotation.x = 0
                temp.position.sub(player.position)
                temp.position.y=0
                temp.position.normalize()
                var temp2 = new THREE.Vector3(-1*temp.position.z,0,temp.position.x)
                player.position.sub(temp2)
                camera.position.sub(temp2)
                break
            case 87:
                var temp = camera.clone()
                temp.rotation.x = 0
                temp.position.sub(player.position)
                temp.position.y=0
                temp.position.normalize()
                player.position.sub(temp.position)
                camera.position.sub(temp.position)
                break
            case 83:
                var temp = camera.clone()
                temp.rotation.x = 0
                temp.position.sub(player.position)
                temp.position.y=0
                temp.position.normalize()
                player.position.add(temp.position)
                camera.position.add(temp.position)
                break
            case 32:
                //jump
                break
            case 80:
                location.reload()
                break
            default:
                console.log(e)
        }
    })
    
    
    
    render()
}

render = function(){
    requestAnimationFrame(render)
    delta = clock.getDelta()
    TWEEN.update()
    world.step(1/60,delta,10)
    for(i=0;i<scene.children.length;i++){
        try{
            scene.children[i].update()
        }catch(err){}
    }
    renderer.render(scene,camera)
}