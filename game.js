window.onload = function(){
    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    world = new CANNON.World()
    world.gravity.set(0,-90,0)
    renderer = new THREE.WebGLRenderer({alpha:true})
    renderer.setClearColor(0xffffff,0)
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
    so = new THREE.Vector3(0,17.677669529663685,17.677669529663685)
    function updatePosition(e) {
        s.theta -= e.movementX / 100
        s.phi -= e.movementY / 100
        s.phi = Math.max(0.1,Math.min(1.55,s.phi))
        s.makeSafe()
        so.setFromSpherical(s)
    }
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    //camera.position.set(0,10,10)
    camera.update = function(){
        camera.position.copy(player.dampPos)
        camera.position.add(so)
        camera.lookAt(player.dampPos)
        Howler.pos(
            camera.position.x,
            camera.position.y,
            camera.position.z
        )
        Howler.orientation(
            camera.matrix.elements[8]*-1,
            camera.matrix.elements[9]*-1,
            camera.matrix.elements[10]*-1)
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
    
    
    
    launchSound = new Howl({
        src:['launch.mp3']
    })
    powerupSound = new Howl({
        src:['powerup.mp3']
    })
    jumpSound = new Howl({
        src:['jump.mp3']
    })
    
    
    
    
    slideMaterial = new CANNON.Material("slideMaterial")
    groundMaterial = new CANNON.Material("groundMaterial")
    slide_ground_cm = new CANNON.ContactMaterial(slideMaterial,groundMaterial,{friction:0.01})
    world.addContactMaterial(slide_ground_cm)
    
    
    
    
    
    
    
    
    
    player = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 4),
        new THREE.MeshLambertMaterial({color:0x324376})
    )
    player.body = new CANNON.Body({
        mass:4,
        shape:new CANNON.Box(new CANNON.Vec3(2,2,2))
    })
    arrow = new THREE.Mesh(new THREE.CylinderBufferGeometry(0,0.33,2,3),new THREE.MeshLambertMaterial({color:0xf6bd60}))
    //arrow.material.transparent = true
    //arrow.material.opacity = 0.7
    //arrow.rotation.x=Math.PI/-2
    //scene.add(arrow)
    player.body.position.y = 4
    //player.body.angularDamping = 0.9
    world.add(player.body)
    player.speed = 18
    player.mSpeed = 18
    player.jSpeed = 12
    player.jumping = 0
    player.jumpVelocity = 40
    
    
    
    
    
    
    player.body.material = groundMaterial
    
    
    
    player.powerupfade = {}
    
    player.scaleTween = {}
    player.scaleFactor = 1
    player.scaling = false
    
    
    
    player.shoot = new THREE.Vector3(1,0,0)
    player.shootTimer = 0
    player.shooting = false
    
    
    
    player.left=0;player.right=0;player.up=0;player.down=0
    player.dampPos = player.position.clone()
    player.update = function(){
        powerupSound.pos(
            player.position.x,
            player.position.y,
            player.position.z
        )
        launchSound.pos(
            player.position.x,
            player.position.y,
            player.position.z
        )
        jumpSound.pos(
            player.position.x,
            player.position.y,
            player.position.z
        )
        var temp = camera.position.clone()
        temp.sub(player.body.position)
        temp.y=0
        temp.normalize()
        player.shoot.copy(temp)
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
        if(player.canMove&&temp2.norm()!=0){
            temp2=temp2.mult(player.speed*player.scaleFactor)
            player.body.velocity.x = temp2.x
            player.body.velocity.z = temp2.z
        }
        
        
        player.quaternion.fromArray(player.body.quaternion.toArray())
        player.position.copy(player.body.position)
        arrow.position.copy(player.position)
        temp.setLength(1.67)
        arrow.position.sub(temp)
        arrow.rotation.z = s.theta
        player.dampPos.x -= (player.dampPos.x-player.position.x)*delta*2
        player.dampPos.y -=(player.dampPos.y-player.position.y)*delta*2
        player.dampPos.z -= (player.dampPos.z-player.position.z)*delta*2
    }
    player.checkJump = function(){
        player.jumping > 1 && player.jumping--
        if(player.jumping == 1){
            for(i=0;i<world.contacts.length;i++){
                if(world.contacts[i].bi.material == groundMaterial || world.contacts[i].bj.material == groundMaterial){
                    if(world.contacts[i].bi == player.body || world.contacts[i].bj == player.body){
                        player.jumping = 0
                        player.speed = player.mSpeed
                    }
                }
            }
        }
    }
    player.jump = function(){
        if(player.jumping==0){
            player.jumping = 20
            player.body.velocity.y = player.jumpVelocity//*player.scaleFactor
            player.speed = player.jSpeed
            jumpSound.play()
        }
    }
    player.launching = false
    player.canMove = true
    player.launch = function(){
        player.launching = true
        player.canMove = false
        player.body.material = slideMaterial
        var temp = player.shoot.clone()
        temp.setLength(20*(1/player.scaleFactor))
        player.body.velocity.set(temp.x*-1,0,temp.z*-1)
        setTimeout(function(){
            player.body.material = groundMaterial
            player.canMove = true
        },300*(0.7/player.scaleFactor))
        setTimeout(function(){
            player.launching = false
        },222*(0.7/player.scaleFactor))
    }
    scene.add(player)
    
    groundGeo = new THREE.PlaneBufferGeometry(20,20)
    ground0mat = new THREE.MeshLambertMaterial({color:0xff928b})
    ground1mat = new THREE.MeshLambertMaterial({color:0xfec3a6})
    ground2mat = new THREE.MeshLambertMaterial({color:0xf5dd90})
    ground3mat = new THREE.MeshLambertMaterial({color:0xf68e5f})
    ground4mat = new THREE.MeshLambertMaterial({color:0xefe9ae})
    groundMats = [ground0mat,ground1mat,ground2mat,ground3mat,ground4mat]
    
    //enemycolors
    // ef476f
    // f76c5e
    // f68e5f
    
    
    ground = new CANNON.Body({
        mass:0,
        shape: new CANNON.Plane()
    })
    ground.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI*-0.5)
    ground.material=groundMaterial
    world.add(ground)
    for(i=0;i<4;i++){
        var temp = new CANNON.Body({
            mass:0,
            shape: new CANNON.Plane(),
            material:slideMaterial
        })
        i==0&&(temp.position.z=-110)
        i==1&&(temp.position.z=90,temp.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI))
        i==2&&(temp.position.x=90,temp.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_Y,Math.PI*-0.5))
        i==3&&(temp.position.x=-110,temp.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_Y,Math.PI/2))
        world.add(temp)
    }
    
    for(x=0;x<10;x++){
        for(z=0;z<10;z++){
            var temp = new THREE.Mesh(groundGeo,groundMats[parseInt(Math.random()*5)])
            temp.rotation.x = Math.PI*-0.5
            temp.position.set((x-5)*20,0,(z-5)*20)
            scene.add(temp)
        }
    }

    
    roomBlock = new THREE.Mesh(
        new THREE.BoxGeometry(10,10,10),
        new THREE.MeshLambertMaterial({color:0x247ba0}))
    scene.add(roomBlock)
    roomBlock.body = new CANNON.Body({
        mass:0,
        shape:new CANNON.Box(new CANNON.Vec3(5,5,5)),
        material:groundMaterial
    })
    world.add(roomBlock.body)
    
    
    
    skyLight = new THREE.DirectionalLight(0xffffff, 0.8)
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
                player.jump()
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
    document.addEventListener('mousedown',function(e){
        //player.scaling = true
        if(e.button==0){
            player.powerupfade = powerupSound.play()
            try{
                player.scaleTween.mesh.stop()
                player.scaleTween.body.stop()
                player.scaleTween.factor.stop()
                player.scaleTween.color.stop()
            }catch(err){}
            player.scaleTween.mesh = new TWEEN.Tween(player.scale)
                .to({x:0.2,y:0.2,z:0.2},2779)
                .easing(TWEEN.Easing.Exponential.Out)
                .start()
            player.scaleTween.body = new TWEEN.Tween(player.body.shapes[0].halfExtents)
                .to({x:0.4,y:0.4,z:0.4},2779)
                .easing(TWEEN.Easing.Exponential.Out)
                .onUpdate(function(){
                    player.body.shapes[0].updateConvexPolyhedronRepresentation()
                    player.body.updateMassProperties()
                    player.body.updateBoundingRadius()})
                .start()
            player.scaleTween.factor = new TWEEN.Tween(player)
                .to({scaleFactor:0.2},2779)
                .easing(TWEEN.Easing.Exponential.Out)
                .start()
            player.scaleTween.color = new TWEEN.Tween(player.material.color)
                .to({r:0.8,g:0.1,b:0.1},2779)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start()
        }
    })
    document.addEventListener('mouseup',function(e){
        //player.scaling = false
        if(e.button==0){
            player.launch()
            try{
                powerupSound.fade(1,0,100,player.powerupfade)
            }catch(err){}
            if(player.scaleFactor<0.8){launchSound.play()}
            try{
                player.scaleTween.mesh.stop()
                player.scaleTween.body.stop()
                player.scaleTween.factor.stop()
                player.scaleTween.color.stop()
            }catch(err){}
            player.scaleTween.mesh = new TWEEN.Tween(player.scale)
                .to({x:1,y:1,z:1},100)
                .easing(TWEEN.Easing.Exponential.Out)
                .start()
            player.scaleTween.body = new TWEEN.Tween(player.body.shapes[0].halfExtents)
                .to({x:2,y:2,z:2},100)
                .easing(TWEEN.Easing.Exponential.Out)
                .onUpdate(function(){
                    player.body.shapes[0].updateConvexPolyhedronRepresentation()
                    player.body.updateMassProperties()
                    player.body.updateBoundingRadius()})
                .start()
            player.scaleTween.factor = new TWEEN.Tween(player)
                .to({scaleFactor:1},100)
                .easing(TWEEN.Easing.Exponential.Out)
                .start()
            player.scaleTween.color = new TWEEN.Tween(player.material.color)
                .to({r:0.196,g:0.2627,b:0.4627},100)
                .easing(TWEEN.Easing.Exponential.Out)
                .start()
        }
    })
    
    render()
}
animate = true
window.addEventListener('blur',function(){animate = false})
window.addEventListener('focus',function(){
    animate = true
    delta = clock.getDelta()
    render()
})
render = function(){
    animate&&requestAnimationFrame(render)
    delta = clock.getDelta()
    TWEEN.update()
    world.step(1/60,delta,10)
    for(i=0;i<scene.children.length;i++){
        try{
            scene.children[i].update()
        }catch(err){}
    }
    player.checkJump()
    renderer.render(scene,camera)
}