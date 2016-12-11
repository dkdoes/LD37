window.onload = function(){
    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    world = new CANNON.World()
    world.gravity.set(0,-270,0)
    renderer = new THREE.WebGLRenderer({alpha:true})
    renderer.setClearColor(0xffffff,0)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.zindex = 0
    document.body.appendChild(renderer.domElement)
    window.addEventListener('click',function(){
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
    s = new THREE.Spherical(50,1*Math.PI/4,0)
    sFix = new THREE.Spherical(50,1*Math.PI/4,0)
    so = new THREE.Vector3(0,17.677669529663685,17.677669529663685)
    function updatePosition(e) {
        s.theta -= e.movementX / 400
        s.phi -= e.movementY / 400
        s.phi = Math.max(0.1,Math.min(1.55,s.phi))
        s.makeSafe()
        //so.setFromSpherical(s)
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
        src:['launch.mp3'],
        volume:0.3
    })
    powerupSound = new Howl({
        src:['powerup.mp3'],
        volume:0.1,
        rate:1.5
    })
    jumpSound = new Howl({
        src:['jump.mp3'],
        volume:0.1
    })
    walldownSound = new Howl({
        src:['walldown.mp3'],
        volume:0.45
    })
    healSound = new Howl({
        src:['heal.mp3'],
        volume:0.45
    })
    saveSound = new Howl({
        src:['save.mp3'],
        volume:1
    })
    loseSound = new Howl({
        src:['lose.mp3'],
        volume:0.45
    })
    enemyDeathSound = new Howl({
        src:['enemyDeath.mp3'],
        volume:0.45
    })
    song = new Howl({
        src:['song0.mp3'],
        loop:true,
        volume:1,
        autoplay:true
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
        shape:new CANNON.Box(new CANNON.Vec3(2,2,2)),
        collisionFilterGroup:1,
        collisionFilterMask:1|2|4
    })
    arrow = new THREE.Mesh(new THREE.CylinderBufferGeometry(0,0.33,2,3),new THREE.MeshLambertMaterial({color:0xf6bd60}))
    //arrow.material.transparent = true
    //arrow.material.opacity = 0.7
    //arrow.rotation.x=Math.PI/-2
    //scene.add(arrow)
    player.body.position.y = 10
    //player.body.angularDamping = 0.9
    world.add(player.body)
    
    player.mSpeed = 36
    player.jSpeed = player.mSpeed * 3 / 4
    player.speed = player.mSpeed
    
    player.launchSpeed = 53
    
    player.jumping = 0
    player.jumpVelocity = 100
    
    
    
    player.kills = 0
    
    
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
        /*
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
        */
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
            temp2=temp2.mult(player.speed*(1 / (2 - player.scaleFactor)))
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
    player.checkLaunch = function(){
        if(player.launching==true /*&& player.body.velocity.length() >= 40*/){
            var velocity = player.body.velocity.length()
            for(var i=0;i<world.contacts.length;i++){
                var target = false
                world.contacts[i].bi == player.body && (target = world.contacts[i].bj)
                world.contacts[i].bj == player.body && (target = world.contacts[i].bi)
                if(target){
                    if(target.name == 'roomBlock' && velocity >= 10){
                        //console.log(player.body.velocity.length())
                        target.parentRef.friendlyDown()
                    }
                    else if(target.name == 'enemy' && velocity >= 40){
                        target.parentRef.kill(true)
                    }
                }
            }
        }
    }
    player.score = 0
    player.wave = 0
    player.saved = 0
    player.scoreTimer = 1
    player.tutorialText = '<br><br>Use the WASD keys to move and the spacebar to jump.<br><br>Hold down the left mouse button to charge up, release it to attack.<br><br>You can temporarily lower the walls of your room by attacking them.<br><br>Capture three of the green spheres to continue.'
    player.checkScore = function(){
        var saved = 0
        for(i=0;i<dudes.length;i++){
            dudes[i].safe==true && saved++
        }
        if (player.scoreTimer >0){
            player.scoreTimer -= delta
        }
        else{
            player.scoreTimer += 1
            player.score += 5 * saved
        }
        player.saved = saved
        document.getElementById('score').innerHTML='Score: '+player.score+'<br>Captured: '+saved+' / '+dudes.length+'<br>Kills: '+player.kills+player.tutorialText
    }
    player.jump = function(){
        if(player.jumping==0){
            player.jumping = 20
            player.body.velocity.y = player.jumpVelocity*(2 / (3 - player.scaleFactor))
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
        temp.setLength(player.launchSpeed*(1/player.scaleFactor))
        player.body.velocity.set(temp.x*-1,0,temp.z*-1)
        setTimeout(function(){
            player.body.material = groundMaterial
            //player.canMove = true
            player.launching = false
        },350*(0.9/player.scaleFactor))
        setTimeout(function(){
            player.canMove = true
        },200*(0.7/player.scaleFactor))
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
    
    //enemy
    //db2b39
    
    //green guy colors
    //00a676
    //7cea9c
    //065143
    //2cda9d
    //4da167
    dudes = []
    
    dudeGeo = new THREE.SphereBufferGeometry(2,12,10)

    dude = function(){
        this.mesh = new THREE.Mesh(
            dudeGeo,
            new THREE.MeshLambertMaterial({color:0x4da167})
        )
        scene.add(this.mesh)
        this.body = new CANNON.Body({
            mass:2,
            shape:new CANNON.Sphere(2),
            material:groundMaterial,
            collisionFilterGroup:1,
            collisionFilterMask:1|2|4
        })
        this.mesh.body = this.body
        this.body.mesh = this.mesh
        this.mesh.parentRef = this
        this.body.parentRef = this
        this.body.name = 'dude'
        world.add(this.body)
        this.mesh.moveTimer = 0
        this.mesh.update = function(){
            if(this.moveTimer >= 0){
                this.moveTimer -= delta
            }
            else{
                this.moveTimer = 1 + Math.random()
                
                var temp = new CANNON.Vec3(Math.random()*160-90,2,Math.random()*160-90)
                temp = temp.vsub(this.body.position)
                temp.normalize()
                this.body.applyImpulse(temp.mult(50),this.body.position)
            }
            this.quaternion.fromArray(this.body.quaternion.toArray())
            this.position.copy(this.body.position)
        }
        this.safe = false
        dudes.push(this)
        this.save = function(){
            if(this.safe == false){
                saveSound.play()
            }
            this.safe = true
        }
        this.lose = function(){
            if(this.safe == true){
                loseSound.play()
            }
            this.safe = false
        }
        this.killed = false
        this.kill = function(){
            if (this.killed == false){
                this.killed = true
                //player.score += 100
                //player.kills++
                //enemyDeathSound.play()
                this.body.collisionFilterMask = 4
                //var temp = this.body.position.vsub(player.body.position)
                //temp.normalize()
                //this.body.velocity = temp.mult(100)
                new TWEEN.Tween(this.mesh.scale)
                    .to({x:4,y:4,z:4},1500)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .start()
                this.mesh.material = this.mesh.material.clone()
                this.mesh.material.transparent = true
                this.mesh.material.parentRef = this
                new TWEEN.Tween(this.mesh.material)
                    .to({opacity:0},1500)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .onComplete(function(){
                        world.remove(this.parentRef.body)
                        scene.remove(this.parentRef.mesh)
                        dudes.splice(dudes.indexOf(this.parentRef),1)
                        delete this.parentRef
                    })
                    .start()
            }
        }
    }
    for(var i=0;i<5;i++){
        var temp = new dude()
        temp.body.position.x = 60
        temp.body.position.z = 60
    }
    
    //octEnemies = []
    octEnemyGeo = new THREE.OctahedronGeometry(2)
    octEnemyMat = new THREE.MeshLambertMaterial({color:0xdb2b39})
    octEnemyShape = new CANNON.Sphere(2)
    octEnemy = function(){
        this.mesh = new THREE.Mesh(
            octEnemyGeo,
            octEnemyMat
        )
        this.body = new CANNON.Body({
            mass:2,
            shape:octEnemyShape,
            material:groundMaterial,
            collisionFilterGroup:1,
            collisionFilterMask:1|2|4
        })
        this.body.position.y = 10
        this.mesh.body = this.body
        this.body.mesh = this.mesh
        this.mesh.parentRef = this
        this.body.parentRef = this
        this.body.name = 'enemy'
        scene.add(this.mesh)
        world.add(this.body)
        //octEnemies.push(this)
        this.mesh.moveTimer = 0
        this.mesh.update = function(){
            if(this.moveTimer >= 0){
                this.moveTimer -= delta
            }
            else{
                this.moveTimer = 1 + Math.random()
                
                //var temp = new CANNON.Vec3(Math.random()*160-90,2,Math.random()*160-90)
                //temp = temp.vsub(this.body.position)
                temp = new CANNON.Vec3(Math.sin(Math.random()*Math.PI*2),0,Math.sin(Math.random()*Math.PI*2))
                temp.normalize()
                this.body.applyImpulse(temp.mult(30),this.body.position)
            }
            this.position.copy(this.body.position)
        }
        this.attack = function(){}
        this.damage = 5
        this.killed = false
        this.kill = function(playerHit){
            if (this.killed == false){
                this.killed = true
                enemyDeathSound.play()
                this.body.collisionFilterMask = 4
                if(playerHit){
                    //var temp = this.body.position.vsub(player.body.position)
                    //temp.normalize()
                    player.score += 100
                    player.kills++
                    var temp = player.body.velocity.clone()
                    temp.normalize()
                    this.body.velocity = temp.mult(100)
                }
                new TWEEN.Tween(this.mesh.scale)
                    .to({x:4,y:4,z:4},1500)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .start()
                this.mesh.material = this.mesh.material.clone()
                this.mesh.material.transparent = true
                this.mesh.material.parentRef = this
                new TWEEN.Tween(this.mesh.material)
                    .to({opacity:0},1500)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .onComplete(function(){
                        world.remove(this.parentRef.body)
                        scene.remove(this.parentRef.mesh)
                        delete this.parentRef
                    })
                    .start()
            }
        }
        this.hit = function(){}
    }
    
    
    tetraGeo = new THREE.TetrahedronGeometry(3)
    tetraShape = new CANNON.ConvexPolyhedron(
        tetraGeo.vertices.map(function(v){return new CANNON.Vec3(v.x,v.y,v.z)}),
        tetraGeo.faces.map(function(f){return [f.a,f.b,f.c]}))
    
    tetraMat = new THREE.MeshLambertMaterial({color:0xf68e5f})
    tetraEnemy = function(){
        this.mesh = new THREE.Mesh(
            tetraGeo,
            tetraMat
        )
        this.body = new CANNON.Body({
            mass:2,
            shape:tetraShape,
            material:slideMaterial,
            collisionFilterGroup:1,
            collisionFilterMask:1|2|4
        })
        this.body.position.y = 10
        this.mesh.body = this.body
        this.body.mesh = this.mesh
        this.mesh.parentRef = this
        this.body.parentRef = this
        this.body.name = 'enemy'
        scene.add(this.mesh)
        world.add(this.body)
        //octEnemies.push(this)
        this.mesh.moveTimer = 0
        this.mesh.update = function(){
            if(this.moveTimer >= 0){
                this.moveTimer -= delta
            }
            else{
                this.moveTimer = 1 + Math.random()*3
                
                //var temp = new CANNON.Vec3(Math.random()*160-90,2,Math.random()*160-90)
                //temp = temp.vsub(this.body.position)
                //temp.normalize()
                //this.body.applyImpulse(temp.mult(50),this.body.position)
                this.parentRef.attack()
            }
            this.quaternion.fromArray(this.body.quaternion.toArray())
            this.position.copy(this.body.position)
        }
        this.attack = function(){
            var temp = new CANNON.Vec3(Math.random()*160-90,2,Math.random()*160-90)
            temp = temp.vsub(this.body.position)
            temp.normalize()
            this.body.applyImpulse(temp.mult(300),this.body.position)
        }
        this.damage = 5
        this.killed = false
        this.kill = function(playerHit){
            if (this.killed == false){
                this.killed = true
                enemyDeathSound.play()
                this.body.collisionFilterMask = 4
                if(playerHit){
                    //var temp = this.body.position.vsub(player.body.position)
                    //temp.normalize()
                    player.score += 100
                    player.kills++
                    var temp = player.body.velocity.clone()
                    temp.normalize()
                    this.body.velocity = temp.mult(100)
                }
                new TWEEN.Tween(this.mesh.scale)
                    .to({x:4,y:4,z:4},1500)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .start()
                this.mesh.material = this.mesh.material.clone()
                this.mesh.material.transparent = true
                this.mesh.material.parentRef = this
                new TWEEN.Tween(this.mesh.material)
                    .to({opacity:0},1500)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .onComplete(function(){
                        world.remove(this.parentRef.body)
                        scene.remove(this.parentRef.mesh)
                        delete this.parentRef
                    })
                    .start()
            }
        }
        this.hit = function(){}
    }
    
    
    
    
    
    ground = new CANNON.Body({
        mass:0,
        shape: new CANNON.Plane(),
        collisionFilterGroup:4,
        collisionFilterMask:1
    })
    ground.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI*-0.5)
    ground.material=groundMaterial
    world.add(ground)
    for(i=0;i<4;i++){
        var temp = new CANNON.Body({
            mass:0,
            shape: new CANNON.Plane(),
            material:slideMaterial,
            collisionFilterGroup:4,
            collisionFilterMask:1
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

    minX=70
    maxX=-90
    minZ=70
    maxZ=-90
    roomBlockGeo = new THREE.BoxGeometry(15,7,3)
    roomBlockMat = new THREE.MeshLambertMaterial({color:0x247ba0})
    roomBlock = function(x,z,r){
        this.room = {x:0,z:0}
        this.mesh = new THREE.Mesh(
            roomBlockGeo,
            roomBlockMat
        )
        scene.add(this.mesh)
        this.body = new CANNON.Body({
            mass:0,
            shape:new CANNON.Box(new CANNON.Vec3(7.5,3.5,1.5)),
            material:groundMaterial,
            collisionFilterGroup: 2,
            collisionFilterMask: 1 
        })
        this.mesh.body = this.body
        this.mesh.parentRef = this
        this.mesh.x = x
        this.mesh.z = z
        if(r){
            this.body.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_Y,Math.PI/2)
            this.mesh.quaternion.fromArray(this.body.quaternion.toArray())
        }
        world.add(this.body)
        this.body.parentRef = this
        this.body.name = "roomBlock"
        this.body.position.set(x,3.5,z)
        //this.body.position.y = 3.5
        this.mesh.update = function(){
            this.timer>0&&(this.timer-=delta)
            this.parentRef.invincible>0&&(this.parentRef.invincible-=delta)
            this.parentRef.damage>0&&(this.parentRef.damage-=delta)
            this.down&&this.timer<=0&&this.parentRef.heal()
            var tempX = Math.max(Math.min(minX,player.body.position.x),maxX)
            var tempZ = Math.max(Math.min(minZ,player.body.position.z),maxZ)
            
            if(player.position.x<(this.position.x-this.x)-18||player.position.x>(this.position.x-this.x)+18||player.position.z<(this.position.z-this.z)-18||player.position.z>(this.position.z-this.z)+18){
                tempSpeed=0
            }
            else if(player.body.position.y>=5 > 0){
                tempSpeed = 0.5
            }
            else{
                tempSpeed = 2.5
            }
            this.body.position.x -= (this.body.position.x-(tempX+this.x))*delta*tempSpeed
            this.body.position.z -= (this.body.position.z-(tempZ+this.z))*delta*tempSpeed
            this.position.copy(this.body.position)
            
            for(var i=0;i<dudes.length;i++){
                if(dudes[i].mesh.position.x>(this.position.x-this.x)-18&&dudes[i].mesh.position.x<(this.position.x-this.x)+18&&dudes[i].mesh.position.z>(this.position.z-this.z)-18&&dudes[i].mesh.position.z<(this.position.z-this.z)+18){
                    dudes[i].save()
                }
                else{
                    dudes[i].lose()
                }
            }
        this.parentRef.room = {x:this.body.position.x - this.x,z:this.body.position.z-this.z}
        }
        this.mesh.hit = false
        this.mesh.down = false
        this.mesh.timer = 0
        this.friendlyDown = function(){
            if(this.mesh.down==false){
                this.mesh.hit = true
                this.mesh.down = true
                this.mesh.timer = 5
                walldownSound.play()
                new TWEEN.Tween(this.body.position)
                    .to({y:-4},200)
                    .easing(TWEEN.Easing.Circular.InOut)
                    .start()
            }
        }
        this.enemyDown = function(){
            if(this.mesh.down==false){
                this.mesh.hit = true
                this.mesh.down = true
                this.mesh.timer = 30
                walldownSound.play()
                new TWEEN.Tween(this.body.position)
                    .to({y:-4},200)
                    .easing(TWEEN.Easing.Circular.InOut)
                    .start()
            }
        }
        this.damage = 0
        this.invincible = 0
        this.takeDamage = function(d){
            if(this.invincible<=0){
                this.damage+=d
                this.invincible = 0.1
                if(this.damage>=10){
                    this.enemyDown()
                }
                var temp = new TWEEN.Tween(roomBlockMat.color)
                    .to({
                        r:0.4,
                        g:0.55,
                        b:0.7
                    },100)
                    .easing(TWEEN.Easing.Exponential.In)
                    .start()
                var temp2 = new TWEEN.Tween(roomBlockMat.color)
                    .to({
                        r:0.1411764705882353,
                        g:0.4823529411764706,
                        b:0.6274509803921569
                    },500)
                    .easing(TWEEN.Easing.Exponential.Out)
                temp.chain(temp2)
            }
        }
        this.heal = function(){
            this.mesh.down = false
            healSound.play()
            new TWEEN.Tween(this.body.position)
                .to({y:3.5},500)
                .easing(TWEEN.Easing.Circular.InOut)
                .start()
        }
        
    }

    room = new roomBlock(12,-18)
    new roomBlock(0,-18)
    new roomBlock(-12,-18)
    new roomBlock(-12,18)
    new roomBlock(0,18)
    new roomBlock(12,18)
    new roomBlock(-18,12,true)
    new roomBlock(-18,0,true)
    new roomBlock(-18,-12,true)
    new roomBlock(18,-12,true)
    new roomBlock(18,0,true)
    new roomBlock(18,12,true)
    
    
    enemyCheck = function(){
        for(var i=0;i<world.contacts.length;i++){
            var attacker = false
            var target = false
            world.contacts[i].bi.name == 'enemy' && (attacker = world.contacts[i].bi,target = world.contacts[i].bj)
            world.contacts[i].bj.name == 'enemy' && (attacker = world.contacts[i].bj,target = world.contacts[i].bi)
            if(attacker){
                if(target.name == 'roomBlock'){
                    target.parentRef.takeDamage(attacker.parentRef.damage)
                    attacker.parentRef.kill()
                }
                else if(target.name == 'dude'){
                    target.parentRef.kill()
                }
            }
        }
    }
    
    
    
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
        if(e.button==0){
            player.launch()
            try{
                powerupSound.fade(0.15,0,100,player.powerupfade)
            }catch(err){}
            if(player.scaleFactor<0.8){
                var temp = launchSound.play()
                launchSound.rate(1.1-(player.scaleFactor/2),temp)
            }
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
    sFix.theta -= (sFix.theta-s.theta)*delta*15
    sFix.phi -= (sFix.phi-s.phi)*delta*15
    so.setFromSpherical(sFix)
    TWEEN.update()
    world.step(1/60,delta,10)
    for(i=0;i<scene.children.length;i++){
        try{
            scene.children[i].update()
        }catch(err){}
    }
    player.checkScore()
    player.checkJump()
    player.checkLaunch()
    if (player.wave == 0){
        if (player.saved >= 3){
            player.wave = 1
            player.tutorialText = '<br><br>Your score increases by 5 points per second for each sphere you have.<br><br>You also get points for destroying enemies.<br><br>Enemies will destroy your spheres, and they\'ll lower your walls.<br><br>The game ends if they destroy all of the spheres on the map.'
        }
    }
    enemyCheck()
    renderer.render(scene,camera)
}