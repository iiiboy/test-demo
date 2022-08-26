// *请求失败时将重新尝试
async function tryAgain(
  fn ,
  count,
  timeout
) {
  let tryCount = 1;
  let timeId;

  const exec = async () => {
    // !await 对于 then 里面返回出来的 Promise 同样起效，所以这里对于 then 或者 catch 返回出来的 exec 依然有效，从而达到重复请求的效果
    return await fn()
      .then((res) => {
        if (timeId) clearTimeout(timeId);
        return res;
      })
      .catch((err) => {
        // 如果大于 count 那么直接 throw
        if (tryCount > count) {
          throw err;
        } else {
          // 不然的话就递归 exec
          console.log(
            `function ${fn.name} Error: ${err}, try: ${tryCount++}`
          );
          if (timeout) {
            if(timeId) clearTimeout(timeId);
            return new Promise((resolve, reject) => {
              // *避免请求失败就直接发起请求，等待一段时间再重新请求
              timeId = setTimeout(() => {
                // *感觉这里可以修改一下，因为 resolve 将会把这个 Promise 修改为 fulfilled。
                // *但是并不会出现问题，因为将会 throw err 即使 resolve 了也还是会被 catch 到
                resolve(exec());
              }, timeout);
            });
          } else return exec();
        }
      });
  };

  // *加不加 await 无所谓
  return await exec();
}

async function a() {
  return new Promise((resolve, reject) => {
    console.log('??')
    // 模拟异步请求
    setTimeout(() => {
      if (false) {
        resolve("gogogog");
      } else {
        reject("sry");
      }
    }, 1000);
  });
}

async function good() {
  console.log('start')
  await tryAgain(a, 3, 500).then((res) => {
    console.log(res)
  }).catch((e) => {
    console.log(e)
  })
  console.log('end')
}

// 在这里可以和 event-loop 的知识点结合起来
// good();
//
// Promise.resolve().then(() => {
//   console.log(123)
// })
//
// console.log('xixi')

/**
 * 上面的打印顺序为：start -> ?? -> xixi ->  123 -> tryAgain 中的若干打印 -> end
 *
 * 其实很好理解， good 依然是一个同步函数，所以执行 good 时 将会直接打印 start
 * 然后 进入 tryAgain 然后再进入 fn 因为 tryAgain fn 前都加了 await 所以到这里都可以看作是同步代码
 * 但是进入 setTimout 会将匿名函数放到 宏队列 中。此时 tryAgain 内就没有同步任务执行了 所以从 good 继续向下执行
 * 然后遇到 Promise.resolve() 放到微队列
 * 然后打印 xixi
 * 然后开始执行 微队列 打印 123
 * 然后执行宏队列，那么也就是 setTimout 中的匿名函数
 * 然后在 tryAgain 中进行递归 打印若干...
 */


// -------------------------------------------------------------------------------------------


async function tryAgain2(fn, count, timeout) {
  let tryCount = 1;
  let timeId;

  const exec = async () => {
    const res = await fn().catch((err) => {
      if (tryCount > count) {
        throw err;
      } else {
        console.log(`请求失败，目前重试 ${tryCount++} 次，err：${err}`);
        return null;
      }
    });
    if (timeId) clearTimeout(timeId);
    if (res) return res;
    else {
      if (timeout) {
        // *修改后的 setTimeout 同样可以完成任务
        await new Promise((resolve) => {
          timeId = setTimeout(() => {
            resolve("timeout");
          }, timeout);
        });
      }
      return exec();
    }
  }
  return exec();
}


tryAgain2(a, 3, 500).then(data => {
  console.log(data)
}).catch(e => {
  console.log(e)
})