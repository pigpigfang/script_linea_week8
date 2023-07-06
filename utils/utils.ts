import {config} from "@/config";
import {readFileSync} from "fs";
import fse from 'fs-extra';
import path from "path";
import {ethers} from 'ethers';
import {lineaProvider} from "@/tasks/base";

export { setTimeout as sleep } from 'node:timers/promises';

/** 生成固定长度的字符串 */
export const randomString = (len: number) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxPos = chars.length;
  let str = '';
  for (let i = 0; i < len; i++) {
    str += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return str;
}

export const randomLetterString = (len: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxPos = chars.length;
  let str = '';
  for (let i = 0; i < len; i++) {
    str += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return str;
}

// 获取txt文件内容，移除空行和制表符并转换为数组
export function getTxtContent(path: string) {
  const str = readFileSync(path, 'utf-8');
  return str.split(/[(\r\n)\r\n]+/).filter(el => el);
}

/** 循环执行直到任务成功 */
export function loop(task) {
  return new Promise(async (resolve) => {
    while (true) {
      try {
        const r = await task();
        resolve(r)
        break;
      } catch (error) {
        const msg = error?.reason || error?.message;
        if (msg === 'insufficient funds for intrinsic transaction cost') {
          console.log(`❌余额不足，跳过...`)
          resolve(false)
          break;
        }
        console.log(`[loop] ${msg}`)
      }
    }
  })
}


/** 
 * 任务执行模块
 * @param taskName 任务名称
 * @param walletAddr 钱包地址
 * @param cb 任务回调
 * @returns
 */
export async function task(cb, opts: {
  taskName: string,
  walletAddr: string,
  runCount?: number
  withLoop?: boolean
  force?: boolean
}) {
  const { taskName, walletAddr, withLoop = config.loopUtilSuccess, force, runCount = 1 } = opts
  // 获取根目录logs文件下的task+walletAddr的json文件
  const logPath = path.join(process.cwd(), 'logs', walletAddr);
  const isExsit = await fse.pathExists(logPath)
  const text = `\n👽[任务:${taskName}]\n钱包:${walletAddr}\n`;
  let log = {};
  // 确保log文件存在
  await loop(async () => {
    log = isExsit
      ? fse.readJSONSync(logPath) || {}
      : fse.writeJSONSync(logPath, {});
  })
  if (log?.[taskName] >= runCount && !force) {
    // return console.log(`👽[任务:${taskName}] 📝已执行，跳过...`)
    return
  }
  console.log(`${text}⌛️执行中...`)
  try {
    (withLoop ? await loop(cb) : await cb());
    const count = (log?.[taskName] || 0) + 1;
    // 确保文件写入成功
    await loop(() => {
      fse.writeJSONSync(logPath, { ...log, [taskName]: count });
      console.log(`✅执行成功!`)
    })
  } catch (error) {
    console.log(`❌执行失败: ${error?.reason || error?.message}`)
  }
}

export const getGasPrice = async () => {
  const gasPrice = await lineaProvider.getGasPrice();
  // console.log(`⛽️当前气价: ${Math.ceil(+gasGwei)}Gwei`)
  return ethers.utils.formatUnits(gasPrice, 'gwei');
}