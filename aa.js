const input = [
  {
    port: {
      sn: 1,
      ems_sn: "122c",
    },
  },
  {
    port: {
      sn: 2,
      ems_sn: "raf",
    },
  },
  {
    port: {
      sn: 3,
      ems_sn: "fds",
    },
  },
  {
    port: {
      sn: 4,
      ems_sn: "maf",
    },
  },
  {
    port: {
      sn: 5,
      ems_sn: "zc2c",
    },
  },
  {
    port: {
      sn: 1,
      ems_sn: null,
    },
  },
  {
    port: {
      sn: 5,
      ems_sn: "mk34",
    },
  },
];

输出;

const output = [
  {
    port: {
      sn: 1,
      ems_sn: "122c",
      is_repeat: true,
    },
  },
  {
    port: {
      sn: 2,
      ems_sn: "raf",
    },
  },
  {
    port: {
      sn: 3,
      ems_sn: "fds",
    },
  },
  {
    port: {
      sn: 4,
      ems_sn: "maf",
    },
  },
  {
    port: {
      sn: "5",
      ems_sn: "zc2c",
      is_repeat: true,
    },
  },
  {
    port: {
      sn: "1",
      is_repeat: true,
      ems_sn: "kkkl",
    },
  },
  {
    port: {
      sn: 1,
      ems_sn: null,
      is_repeat: true,
    },
  },
  {
    port: {
      sn: 5,
      ems_sn: "mk34",
      is_repeat: true,
    },
  },
];

 