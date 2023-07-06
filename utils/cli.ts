import { parseArgs } from "node:util";
import {getGasPrice, getTxtContent} from "./utils";
import path from "node:path";

type CallbackFn = (p: {
  action: string,
  startIdx: number,
  endIdx: number,
  pks: string[],
}) => Promise<void>;

export const cli = async (cb: CallbackFn, run = true) => {
  if (!run) return;
  let gasPrice = parseFloat(await getGasPrice());
  // 获取当前时间
  let currentDateTime = new Date();
  while(gasPrice > 3000) {
    console.log(`🤯🤯🤯At: \x1b[31m%s\x1b[0m Waiting for Gas to drop... Current gas price is \x1b[36m%s\x1b[0m`, currentDateTime.toLocaleString(), gasPrice);
    await new Promise(resolve => setTimeout(resolve, 30000)); // wait for 10 seconds
    gasPrice = parseFloat(await getGasPrice());
    currentDateTime = await new Date();
  }
  const {
    values: { action, batch },
  } = parseArgs({
    options: {
      /** 执行动作 */
      action: {
        type: "string",
        short: "a",
        default: '',
      },
      /** 任务并行切割分组 */
      batch: {
        type: "string",
        short: "b",
        default: '',
      },
    },
  });

  const keys = getTxtContent(path.resolve(__dirname, '../keys.txt')).filter(Boolean) as string[];
  const [startIdx, endIdx] = [0, keys.length - 1];
  // 将startIdx和endIdx的区间分成slice份
  const s = batch || 1;
  const sliceSize = Math.ceil((endIdx - startIdx + 1) / +s);
  const fns = [];
  for (let i = 0; i < +s; i++) {
    const start = startIdx + i * sliceSize;
    let end = startIdx + (i + 1) * sliceSize - 1;
    end = end >= endIdx ? endIdx : end;
    fns.push(async () => {
      await cb?.({
        action, pks: keys, startIdx: start, endIdx: end
      });
    })
  }
  console.time('total');
  await Promise.all(fns.map(fn => fn()));
  console.timeEnd('total');
}