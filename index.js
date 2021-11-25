#! /usr/bin/env node
const { $,question,chalk,argv } = require('zx');
const fs = require('fs');
const path = require('path');
const { dockerServers } = require(path.resolve(process.cwd(), 'package.json'));

//rewite function of zx lib
$.quote = function(arg) {
    return arg;
}

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
        const imageName = `${remoteImage}:${deployto}_${Math.random()}`;
        await $`docker tag ${localImage} ${server}/${nameSpace}/${imageName}`;
        console.log(chalk.greenBright('push image...'));
        await $`docker push ${server}/${nameSpace}/${imageName}`;
        console.log(chalk.yellow('Haha ！！！ image publish sucess!'));
        console.log(chalk.yellow(`${server}/${nameSpace}/${imageName}`));
    } catch(e) {
        console.log(e.message)
    }
}();