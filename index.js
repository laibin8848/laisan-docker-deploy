#! /usr/bin/env node
const { $,question,chalk,argv } = require('zx');
const fs = require('fs');
const { dockerServers } = require('./package.json');

void async function () {
    //静默模式
    $.verbose = false;
    
    //依赖zx库，所以node版本校验
    const p = await $`node -v`
    const nodeV = parseFloat(p.stdout.substr(1));
    if(nodeV < 14.13) {
        console.log(chalk.red(`Current Node version is: ${nodeV}。Please use Node version> 14.13.`));
        return;
    }
    
    //判断是否存在Dockerfile
    const exist = await fs.existsSync('./Dockerfile');
    if(!exist) {
        console.log(chalk.red(`Please add a Dockerfile.`));
        return;
    }
    
    //判断pkg文件里有没有docker部署的相关配置，如果有读取配置数组，可配置不同环境
    let { deployto } = argv;
    const deploys = Object.keys(dockerServers);
    if(!deploys.includes(deployto)) {
        deployto = await question('Please select one server to deploy.', { choices: deploys });
    }
    
    if(!deployto) {
        console.log(chalk.red(`Unreadable deploy server config.`));
        return;
    }
    
    const { localImage, server, nameSpace, remoteImage } = dockerServers[deployto] || {};
    if(!localImage || !server || !nameSpace || !remoteImage) {
        console.log(chalk.red(`Please check you server config.`));
        return;
    }
    
    try {
        console.log(chalk.greenBright('building image...'))
        await $`docker build -t ${localImage} .`;
        console.log(chalk.greenBright('do tag...'));
        const imageName = remoteImage + Math.random();
        //hack dev server
        if(deployto === 'dev') {//todo need remove
            await $`docker tag ${localImage} 172.16.11.205:8001/${nameSpace}/${imageName}`;
            console.log(chalk.greenBright('push image...'));
            await $`docker push 172.16.11.205:8001/${nameSpace}/${imageName}`;
        } else {
            await $`docker tag ${localImage} ${server}/${nameSpace}/${imageName}`;
            console.log(chalk.greenBright('push image...'));
            await $`docker push ${server}/${nameSpace}/${imageName}`;
        }
        // const xx = '172.16.11.205:8001/yueyun-delivery/set-iot-admin-front';
        // console.log(/^[a-z0-9/_.-]+$/i.test(xx));
        // await $`docker tag ${localImage} 172.16.11.205:8001/yueyun-delivery/set-iot-admin-front_${Math.random()}`;
    } catch(e) {
        console.log(e.message)
    }
}();