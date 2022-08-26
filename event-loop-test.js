// TODO 最初想测试 event-loop 是不是 同步 -> 完全清空微任务 -> 执行一个宏任务 这样的顺序，但是想不出来能够证明只执行一个宏任务的测试案例

setTimeout(() => {
  console.log(123)
}, 0)

setTimeout(() => {
  console.log(456)
}, 0)

async function s() {
  console.log('start');

  // *注意 不管后面跟的是不是 Promise await 下面的都会被放到 then 中进行
  await console.log(1)
  console.log(2) // *将在 end 后面执行
  await console.log(3)
  console.log(4) // 打印顺序为 2 -> 5 -> 3 -> 4 说明 await 确实是放到 then 中进行的，因为与 Promise.resolve 是交叉进入队列的
}

s();

Promise.resolve().then(() => {
  console.log(5)
}).then(() => {
  console.log(6)
})


console.log('end')