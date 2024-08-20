// 树结构过滤即保留某些符合条件的节点，剪裁掉其它节点。一个节点是否保留在过滤后的树结构中，取决于它以及后代节点中是否有符合条件的节点。可以传入一个两数描述符合条件的节点
let data = [
    {
        id: 1,
        name: 'mock',
        type: 1,
        subs: [
            {
                id: 4,
                name: 'agency.sol',
                type: 2,
                subs: {
                    id: 10,
                    name: 'account.sol',
                    type: 2,
                    subs: null,
                },
            },
            {
                id: 5,
                name: 'blockchain.sol',
                type: 2,
                subs: null,
            },
        ],
    },
    {
        id: 2,
        name: 'public',
        type: 1,
        subs: [
            {
                id: 6,
                name: 'vote.sol',
                type: 2,
                subs: null,
            },
            {
                id: 7,
                name: 'user.sol',
                type: 2,
                subs: null,
            },
        ],
    },
]

// 第一
function filter(condition = () => false, key) {
    return function filtrate(data) {
        return data.reduce((res, item) => {
            if (!condition(item)) {
                const children = item[key];
                res.push({
                    ...item,
                    [key]: Array.isArray(children) ? filtrate(children) : children,
                });
            }
            return res;
        }, []);
    }
}


var filterIdEqual2 = filter(item => item.id == 2, 'subs')
var filterIdEqual7 = filter(item => item.id == 7, 'subs')

console.log(filterIdEqual2(data))
console.log('----------')
console.log(filterIdEqual7(data))

// 第二
function filterTree(tree = [], map = [], arr = []) {
    if (!tree.length) return []
    for (let item of tree) {
        if (map.includes(item.id)) continue
        let node = undefined
        if (Array.isArray(item.subs)) {
            node = { ...item, subs: [] }
        } else {
            node = { ...item }
        }
        arr.push(node)
        if (item.subs && item.subs.length) filterTree(item.subs, map, node.subs)
    }
    return arr
}

const result = filterTree(data, [6, 7])

// 第三
function treeFilter(tree, func) {
    // 使用map复制一下节点，避免修改到原树
    return tree.map(node => ({ ...node }).filter(node => {
        node.children = node.children && treeFilter(node.children, func)
        return func(node) || (node.children && node.children.length)
    }))
}


// https://wintc.top/article/20
