window.onload = function(){
    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    world = new CANNON.World()
    world.gravity.set(0,-90,0)
    renderer = new THREE.WebGLRenderer({alpha:true})
    //renderer.shadowMap.enabled = true
    //renderer.shadowMapType = 0
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
    so = new THREE.Vector3(0,10.606601717798211,10.606601717798211)
    function updatePosition(e) {
        s.theta -= e.movementX / 100
        s.phi -= e.movementY / 100
        s.phi = Math.max(0.1,Math.min(1.55,s.phi))
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
        new THREE.MeshLambertMaterial({color:0x99aaff})
    )
    player.body = new CANNON.Body({
        mass:4,
        shape:new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5))
    })
    arrow = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.03,0.33,2,6),new THREE.MeshLambertMaterial({color:0x9988dd}))
    arrow.material.transparent = true
    arrow.material.opacity = 0.7
    arrow.rotation.x=Math.PI/-2
    scene.add(arrow)
    player.body.position.y = 4
    player.body.angularDamping = 0.9
    world.add(player.body)
    player.speed = 15
    player.mSpeed = 15
    player.jSpeed = 12
    player.jumping = 0
    player.jumpVelocity = 40
    player.shoot = new THREE.Vector3(1,0,0)
    player.shootTimer = 0
    player.shooting = false
    player.left=0;player.right=0;player.up=0;player.down=0
    player.dampPos = player.position.clone()
    player.update = function(){
        player.shootTimer>0&&(player.shootTimer-=delta)
        if(player.shooting&&player.shootTimer<=0){
            for(i=0;i<3;i++){
                var temp = arrow.clone()
                temp.dir = player.shoot.clone()
                temp.dir.setLength(1.4)
                temp.dir.add(new THREE.Vector3(
                    Math.random()*0.1-0.05,
                    Math.random()*0.01-0.005,
                    Math.random()*0.1-0.05))
                temp.life = 1
                temp.update = function(){
                    this.position.sub(this.dir)
                    this.life-=delta
                    this.life<=0&&scene.remove(this)
                }
                scene.add(temp)
            }
            player.shootTimer=0.1
        }
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
        if(temp2.norm()!=0){
            temp2=temp2.mult(player.speed)
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
                if(world.contacts[i].bi == ground0.body || world.contacts[i].bj == ground0.body){
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
            player.body.velocity.y = player.jumpVelocity
            player.speed = player.jSpeed
        }
    }
    scene.add(player)
    
    ground0 = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(20,20),
            new THREE.MeshLambertMaterial({color:0xf7ede2})
    )
    ground0.rotation.x = Math.PI*-0.5
    ground1 = ground0.clone()
    ground2 = ground0.clone()
    ground3 = ground0.clone()
    ground1.material = new THREE.MeshLambertMaterial({color:0xf5cac3})
    ground2.material = new THREE.MeshLambertMaterial({color:0x84a59d})
    ground3.material = new THREE.MeshLambertMaterial({color:0xf7edf0})
    scene.add(ground0)
    ground1.position.x+=20
    scene.add(ground1)
    ground2.position.z+=20
    scene.add(ground2)
    ground3.position.x+=20
    ground3.position.z+=20
    scene.add(ground3)
    
    
    ground0.body = new CANNON.Body({
        mass:0,
        shape: new CANNON.Plane()
    })
    
    ground0.body.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI*-0.5)
    world.add(ground0.body)
    
    skyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    skyLight.position.set(1,2,1)
    scene.add(skyLight)
    ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    floorLight = new THREE.DirectionalLight(0xffffff, 0.3)
    floorLight.position.set(-1,-2,-1)
    scene.add(floorLight)
    
    
    //player.castShadow = true
    //skyLight.castShadow = true
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
        player.shooting = true
    })
    document.addEventListener('mouseup',function(e){
        player.shooting = false
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