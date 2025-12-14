/**
 * 在一棵树（forest）中，只保留：
 *   1. 目标节点及其完整子树
 *   2. 目标节点的兄弟节点（直接父节点的其他子节点），但剪掉它们的子节点
 *   3. 其余所有分支全部删除
 *
 * @param {Array<Object>} tree      原始树结构数组，每个节点形如 { id: xxx, children: [...] }
 * @param {String|Number} targetId  目标节点的 id
 * @returns {Array<Object>}         过滤后的树结构
 */
function filterTreeById(tree, targetId) {
  // 先定义一个辅助，判断某个子树里是否含有 targetId
  function containsTarget(node) {
    if (node.id === targetId) return true;
    if (!node.children) return false;
    return node.children.some(containsTarget);
  }

  // 递归构建过滤后节点
  function filterNode(node) {
    // 如果正好是目标节点：深拷贝并保留它原有的整个子树
    if (node.id === targetId) {
      return JSON.parse(JSON.stringify(node));
    }

    // 如果本节点的某个直接子节点正好就是目标，
    //   那它就是“目标节点的父节点”，
    //   需要保留所有直接子节点，但对子节点剪切其子树
    const directChildIsTarget = node.children?.some((c) => c.id === targetId);
    if (directChildIsTarget) {
      return {
        ...node,
        children: node.children.map((c) => {
          if (c.id === targetId) {
            // 目标节点：递归，保留完整子树
            return filterNode(c);
          } else {
            // 兄弟节点：只保留自己，子节点剪除
            return { id: c.id, /* 你其它属性也可展开 ...c */ children: [] };
          }
        }),
      };
    }

    // 如果本节点不是目标，也不是父节点，但它的某个后代包含目标，
    //   那它是祖先，需要沿着这条唯一的“通向目标”的分支继续往下
    if (node.children && node.children.some(containsTarget)) {
      return {
        ...node,
        children: node.children.filter(containsTarget).map(filterNode),
      };
    }

    // 其它情况：既不是目标，也不在通向目标的分支上，剪除
    return null;
  }

  // 对森林的每个根节点都尝试一次
  const res = [];
  for (const root of tree) {
    const fn = filterNode(root);
    if (fn) res.push(fn);
  }
  return res;
}

let data = [
  {
    name: "总部",
    id: "810000201202085623",
    children: [
      {
        name: "研发部",
        id: "320000199101255121",
        children: [
          {
            name: "研发一部",
            id: "510000200612064491",
            children: [
              {
                name: "研发小组",
                id: "320000201212254076",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "河南省总部",
    id: "650000200511226819",
    children: [
      {
        name: "河南省研发部",
        id: "43000019830405315X",
        children: [
          {
            name: "河南省研发一部",
            id: "450000199210011168",
            children: [
              {
                name: "河南省研发小组",
                id: "530000197605268946",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "河南省测试部",
        id: "410000197307283550",
        children: [
          {
            name: "河南省测试一部",
            id: "64000020081109166X",
            children: [
              {
                name: "河南省测试小组",
                id: "140000198211061696",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "湖北省总部",
    id: "360000202302121498",
    children: [
      {
        name: "湖北省研发部",
        id: "810000199911300314",
        children: [
          {
            name: "湖北省研发一部",
            id: "430000201308307879",
            children: [
              {
                name: "湖北省研发小组",
                id: "650000197202060822",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "湖北省测试部",
        id: "630000199407168576",
        children: [
          {
            name: "湖北省测试一部",
            id: "310000200508138414",
            children: [
              {
                name: "湖北省测试小组",
                id: "640000198201259525",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "湖南省总部",
    id: "520000199210180277",
    children: [
      {
        name: "湖南省研发部",
        id: "350000198606055812",
        children: [
          {
            name: "湖南省研发一部",
            id: "320000201405199704",
            children: [
              {
                name: "湖南省研发小组",
                id: "640000198304185768",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "湖南省测试部",
        id: "330000201201166419",
        children: [
          {
            name: "湖南省测试一部",
            id: "65000019761207678X",
            children: [
              {
                name: "湖南省测试小组",
                id: "410000201102075693",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "广东省总部",
    id: "410000197010223637",
    children: [
      {
        name: "广东省研发部",
        id: "610000199509256813",
        children: [
          {
            name: "广东省研发一部",
            id: "350000198008257393",
            children: [
              {
                name: "广东省研发小组",
                id: "210000200201047215",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "广东省测试部",
        id: "420000197207047229",
        children: [
          {
            name: "广东省测试一部",
            id: "130000201501162973",
            children: [
              {
                name: "广东省测试小组",
                id: "440000202406302568",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "浙江省总部",
    id: "340000202410028385",
    children: [
      {
        name: "浙江省研发部",
        id: "460000199204166237",
        children: [
          {
            name: "浙江省研发一部",
            id: "340000199511054561",
            children: [
              {
                name: "浙江省研发小组",
                id: "36000019911110448X",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "浙江省测试部",
        id: "440000200210136861",
        children: [
          {
            name: "浙江省测试一部",
            id: "460000199202277232",
            children: [
              {
                name: "浙江省测试小组",
                id: "440000198005096987",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
];
let trees = [
  {
    id: 1,
    children: [
      {
        id: 2,
        children: [
          { id: 4, children: [{ id: 8 }, { id: 9 }] },
          { id: 5, children: [{ id: 10 }, { id: 11 }] },
        ],
      },
      {
        id: 3,
        children: [
          { id: 6, children: [{ id: 12 }, { id: 13 }] },
          { id: 7, children: [{ id: 14 }, { id: 15 }] },
        ],
      },
    ],
  },
  {
    id: 16,
    children: [
      {
        id: 17,
        children: [{ id: 18 }, { id: 19 }],
      },
      {
        id: 20,
        children: [{ id: 21 }, { id: 22 }],
      },
    ],
  },
  {
    id: 23,
    children: [{ id: 24 }, { id: 25 }],
  },
];
console.log(filterTreeById(data, "460000199202277232"));



