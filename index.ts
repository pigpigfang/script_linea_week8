/**
 * Linea Voyage Week8
 * 
 * Author @3lang3 2023-07-01
 * Github: https://github.com/3lang3
 */

import { cli } from './utils/cli';
import { ethers } from 'ethers';

import * as pancake from './tasks/pancake';
import * as kyberswap from './tasks/kyberswap';
import * as airswap from './tasks/airswap';
import * as sushiswap from './tasks/sushiswap';
import * as uniswap from './tasks/uniswap';
import * as izumi from './tasks/izumi';
import * as squid from './tasks/squid';
import * as mendi from './tasks/mendi';
import * as dforce from './tasks/dforce';
import * as velocore from './tasks/velocore';
import * as zkex from './tasks/zkex';
import * as symbiosis from './tasks/symbiosis';
import * as cashmere from './tasks/cashmere';
import * as openocean from './tasks/openocean';
import * as noobysswap from './tasks/noobysswap/api';
import * as compound from './tasks/compound';
import * as zkusd from './tasks/zkusd';
import * as gridex from './tasks/gridex';
import { config } from './config';
import {getGasPrice, loop} from './utils/utils';

const main = async (wallet: ethers.Wallet) => {
  const tasks = [
    () => pancake.run(wallet),
    () => compound.run(wallet),
    () => kyberswap.run(wallet),
    () => airswap.run(wallet),
    () => sushiswap.run(wallet),
    () => uniswap.run(wallet),
    // () => cashmere.run(wallet),
    () => izumi.run(wallet),
    () => zkusd.run(wallet),
    () => squid.run(wallet),
    () => mendi.run(wallet),
    () => dforce.run(wallet),
    () => velocore.run(wallet),
    () => gridex.run(wallet),
    // () => zkex.run(wallet),
    () => symbiosis.run(wallet),
    () => openocean.run(wallet),
    () => noobysswap.run(wallet),
  ];

  // 乱序函数
  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // 当仍然有元素未洗牌
    while (0 !== currentIndex) {

      // 选择剩下的元素
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // 交换现在的元素和选择的元素
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  // 打乱任务顺序
  shuffle(tasks);

  // 执行所有任务
  for(let task of tasks) {
    // 检查GAS价格
    await task();
  }
}

cli(async ({ action, pks, startIdx, endIdx }) => {
  if (action === 'pre_cashmere') {
    await cashmere.airdropTUSDT();
    return;
  }
  for (let k = startIdx; k <= endIdx; k++) {
    const pk = pks[k];
    const wallet = new ethers.Wallet(pk);
    try {
      if (config.loopUtilSuccess) {
        await loop(async () => {
          await main(wallet);
        })
      } else {
        await main(wallet);
      }
    } catch (error) {
      console.log(error?.reason || error?.message)
    }
  }
});
