'use strict';

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let analyticsFilterController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let SERVICE = require('../services/commonService');
let CONSTANTS = require('../util/constants');
let FS = require('fs');
const { Response } = require('aws-sdk');
var request = require('request');
const https = require('https');

analyticsFilterController.monthlyUsers = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.userModel
      .find({
        verified : true,
        roles: "client",
        $expr: {
          $and: [
            { $eq: [{ $year: '$createAt' }, year] },
            { $eq: [{ $month: '$createAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.userModel
          .find({
            roles: "client",
            verified : true,
            $expr: {
              $and: [
                { $eq: [{ $year: '$createAt' }, year] },
                { $eq: [{ $month: '$createAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.userModel
              .find({
                roles: "client",
                verified : true,
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createAt' }, year] },
                    { $eq: [{ $month: '$createAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.userModel
                  .find({
                    roles: "client",
                    verified : true,
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createAt' }, year] },
                        { $eq: [{ $month: '$createAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.userModel
                      .find({
                        roles: "client",
                        verified : true,
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createAt' }, year] },
                            { $eq: [{ $month: '$createAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.userModel
                          .find({
                            roles: "client",
                            verified : true,
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createAt' }, year] },
                                { $eq: [{ $month: '$createAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.userModel
                              .find({
                                roles: "client",
                                verified : true,
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createAt' }, year] },
                                    { $eq: [{ $month: '$createAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.userModel
                                  .find({
                                    roles: "client",
                                    verified : true,
                                    $expr: {
                                      $and: [
                                        { $eq: [{ $year: '$createAt' }, year] },
                                        { $eq: [{ $month: '$createAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.userModel
                                      .find({
                                        roles: "client",
                                        verified : true,
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [{ $month: '$createAt' }, 9],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.userModel
                                          .find({
                                            roles: "client",
                                            verified : true,
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.userModel
                                              .find({
                                                roles: "client",
                                                verified : true,
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        { $month: '$createAt' },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.userModel
                                                  .find({
                                                    roles: "client",
                                                    verified : true,
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.userModel
                                                      .find({ 
                                                        roles: "client",
                                                        verified : true,
                                                      })
                                                      .then((Analytics) => {
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            users: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length + jan.length,
                                                            users: [...feb, ...jan ],
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length + feb.length + jan.length,
                                                            users: [...march, ...feb , ...jan]
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length  + march.length + feb.length + jan.length,
                                                            users: [...april, ...march , ...feb , ...jan]
                                                          },
                                                          MAY: {
                                                            amount: may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...may, ...april , ...march , ...feb , ...jan] 
                                                          },
                                                          JUNE: {
                                                            amount: june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          JULY: {
                                                            amount: july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length+ sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Oct,...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length+Oct.length+ sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Nov,...Oct,...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length+Nov.length+Oct.length+ sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Dec,...Nov,...Oct,...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                          
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                            users: Analytics,
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

analyticsFilterController.monthlyRecyclers = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.collectorModel
      .find({
        verified : true,
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.collectorModel
          .find({
            verified : true,
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.collectorModel
              .find({
                verified : true,
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.collectorModel
                  .find({
                    verified : true,
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.collectorModel
                      .find({
                        verified : true,
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.collectorModel
                          .find({
                            verified : true,
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.collectorModel
                              .find({
                                verified : true,
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.collectorModel
                                  .find({
                                    verified : true,
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createdAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createdAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.collectorModel
                                      .find({
                                        verified : true,
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createdAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createdAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.collectorModel
                                          .find({
                                            verified : true,
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createdAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createdAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.collectorModel
                                              .find({
                                                verified : true,
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createdAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createdAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.collectorModel
                                                  .find({
                                                    verified : true,
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createdAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createdAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.collectorModel
                                                      .find({ verified : true })
                                                      .then((Analytics) => {
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            users: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length + jan.length,
                                                            users: [...feb, ...jan ],
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length + feb.length + jan.length,
                                                            users: [...march, ...feb , ...jan]
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length  + march.length + feb.length + jan.length,
                                                            users: [...april, ...march , ...feb , ...jan]
                                                          },
                                                          MAY: {
                                                            amount: may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...may, ...april , ...march , ...feb , ...jan] 
                                                          },
                                                          JUNE: {
                                                            amount: june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          JULY: {
                                                            amount: july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length+ sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Oct,...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length+Oct.length+ sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Nov,...Oct,...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length+Nov.length+Oct.length+ sept.length+Aug.length + july.length+ june.length + may.length + april.length + march.length + feb.length + jan.length,
                                                            users: [...Dec,...Nov,...Oct,...sept,...Aug,...july, ...june,...may, ...april , ...march , ...feb , ...jan]
                          
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                            users: Analytics,
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};




analyticsFilterController.monthlySchedules = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.scheduleModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.scheduleModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.scheduleModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.scheduleModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.scheduleModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.scheduleModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.scheduleModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.scheduleModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createdAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createdAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.scheduleModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createdAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createdAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.scheduleModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createdAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createdAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.scheduleModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createdAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createdAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.scheduleModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createdAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createdAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.scheduleModel
                                                      .find({})
                                                      .then((Analytics) => {
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            // schedules: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                            // schedules: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                            // schedules: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                            // schedules: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                            // schedules: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                            // schedules: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                            // schedules: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                            // schedules: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                            // schedules: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                            // schedules: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                            // schedules: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                            // schedules: Dec,
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                            // schedules: Analytics,
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};



analyticsFilterController.monthlyAdverts = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.advertModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.advertModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.advertModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.advertModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.advertModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.advertModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.advertModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.advertModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createdAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createdAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.advertModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createdAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createdAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.advertModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createdAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createdAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.advertModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createdAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createdAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.advertModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createdAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createdAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.advertModel
                                                      .find({})
                                                      .then((Analytics) => {
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                           adverts: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                           adverts: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                           adverts: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                           adverts: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                           adverts: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                           adverts: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                           adverts: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                           adverts: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                           adverts: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                           adverts: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                           adverts: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                           adverts: Dec,
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                           adverts: Analytics,
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};




analyticsFilterController.monthlyReports = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.reportLogModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.reportLogModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.reportLogModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.reportLogModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.reportLogModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.reportLogModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.reportLogModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.reportLogModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createdAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createdAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.reportLogModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createdAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createdAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.reportLogModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createdAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createdAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.reportLogModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createdAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createdAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.reportLogModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createdAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createdAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.reportLogModel
                                                      .find({})
                                                      .then((Analytics) => {
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                           reports: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                           reports: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                           reports: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                           reports: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                           reports: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                           reports: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                           reports: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                           reports: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                           reports: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                           reports: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                           reports: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                           reports: Dec,
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                           reports: Analytics,
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};


analyticsFilterController.monthlyCompanies = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.organisationModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createAt' }, year] },
            { $eq: [{ $month: '$createAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.organisationModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createAt' }, year] },
                { $eq: [{ $month: '$createAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.organisationModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createAt' }, year] },
                    { $eq: [{ $month: '$createAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.organisationModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createAt' }, year] },
                        { $eq: [{ $month: '$createAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.organisationModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createAt' }, year] },
                            { $eq: [{ $month: '$createAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.organisationModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createAt' }, year] },
                                { $eq: [{ $month: '$createAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.organisationModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createAt' }, year] },
                                    { $eq: [{ $month: '$createAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.organisationModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.organisationModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.organisationModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.organisationModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.organisationModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.organisationModel
                                                      .find({})
                                                      .then((Analytics) => {
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                           companies: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                           companies: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                           companies: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                           companies: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                           companies: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                           companies: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                           companies: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                           companies: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                           companies: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                           companies: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                           companies: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                           companies: Dec,
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                           companies: Analytics,
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};



analyticsFilterController.monthlyWasteCollected = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.transactionModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.transactionModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.transactionModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.transactionModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.transactionModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.transactionModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.transactionModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.transactionModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createdAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createdAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.transactionModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createdAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createdAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.transactionModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createdAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createdAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.transactionModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createdAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createdAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.transactionModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createdAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createdAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.transactionModel
                                                      .find({})
                                                      .then((Analytics) => {
                                                
                                                        RESPONSE.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0)
                                                          
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0)
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0)
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          MAY: {
                                                            amount: may.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          JUNE: {
                                                            amount: june.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          JULY: {
                                                            amount: july.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.map(x=>x.weight).reduce((acc,curr)=>acc+curr,0),
                                                          },
                                                        });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};


analyticsFilterController.advertsRequest = (REQUEST,RESPONSE)=>{
  try{
    MODEL.advertModel.find({
      authenticated: false
    }).then((adverts)=>{
      return RESPONSE.status(200).json(adverts)
    })
  }
  catch(err){
        return RESPONSE.status(500).json(err)
  }
}






/* export analyticsFilterController */
module.exports = analyticsFilterController;
