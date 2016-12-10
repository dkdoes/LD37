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
    s = new THREE.Spherical(25,1*Math.PI/4,0)
    so = new THREE.Vector3(0,10.606601717798211,10.606601717798211)
    function updatePosition(e) {
        s.theta -= e.movementX / 100
        s.phi -= e.movementY / 100
        s.phi = Math.min(1.55,s.phi)
        s.makeSafe()
        so.setFromSpherical(s)
    }
    
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0,10,10)
    camera.update = function(){
        camera.position.copy(player.dampPos)
        camera.position.add(so)
        camera.lookAt(player.dampPos)
        
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
    player.body = new CANNON.Body({
        mass:4,
        shape:new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5))
    })
    player.body.position.y = 4
    world.add(player.body)
    player.speed = 10
    player.left=0;player.right=0;player.up=0;player.down=0
    player.dampPos = player.position.clone()
    player.update = function(){
        var temp = camera.position.clone()
        temp.sub(player.body.position)
        temp.y=0
        temp.normalize()
        var temp2 = new CANNON.Vec3()
        if(player.up==1){
            temp2=temp2.vsub(temp)
        }
        else if(player.down==1){
            temp2=temp2.vadd(temp)
        }
        if(player.right==1){
            var temp3 = new CANNON.Vec3(temp.z,0,temp.x*-1)
            temp2=temp2.vadd(temp3)
        }
        else if(player.left==1){
            var temp3 = new CANNON.Vec3(temp.z,0,temp.x*-1)
            temp2=temp2.vsub(temp3)
        }
        temp2.normalize()
        if(temp2.norm()!=0){
            temp2=temp2.mult(player.speed)
            player.body.velocity.x = temp2.x
            player.body.velocity.z = temp2.z
        }
        player.quaternion.fromArray(player.body.quaternion.toArray())
        player.position.copy(player.body.position)
        player.dampPos.x -= (player.dampPos.x-player.position.x)*delta*10
        player.dampPos.y -=(player.dampPos.y-player.position.y)*delta*3
        player.dampPos.z -= (player.dampPos.z-player.position.z)*delta*10
    }
    scene.add(player)
    
    ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(10,10),
            new THREE.MeshLambertMaterial({color:0xffdddd})
    )
    ground.material.side = THREE.DoubleSide
    ground.rotation.x = Math.PI*-0.5
    scene.add(ground)
    
    ground.body = new CANNON.Body({
        mass:0,
        shape: new CANNON.Plane()
    })
    ground.body.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI*-0.5)
    world.add(ground.body)
    
    skyLight = new THREE.DirectionalLight(0xffffff, 1)
    skyLight.position.set(1,2,1)
    scene.add(skyLight)
    ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    floorLight = new THREE.DirectionalLight(0xffffff, 0.3)
    floorLight.position.set(-1,-2,-1)
    scene.add(floorLight)
    
    document.addEventListener('keydown',function(e){
        e.preventDefault()
        e = e || window.event
        e = e.which || e.keyCode
        switch(e){
            case 65:
                player.left = 1
                player.right == 1 && player.right++
                break
            case 68:
                player.right = 1
                player.left == 1 && player.left++
                break
            case 87:
                player.up = 1
                player.down == 1 && player.down++
                break
            case 83:
                player.down = 1
                player.up == 1 && player.up++
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
     document.addEventListener('keyup',function(e){
        e.preventDefault()
        e = e || window.event
        e = e.which || e.keyCode
        switch(e){
            case 65:
                player.left = 0
                player.right == 2 && player.right--
                break
            case 68:
                player.right = 0
                player.left == 2 && player.left--
                break
            case 87:
                player.up = 0
                player.down == 2 && player.down--
                break
            case 83:
                player.down = 0
                player.up == 2 && player.up--
                break
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