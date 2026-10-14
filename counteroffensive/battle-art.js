(function(root){
  const art={
  "infantry-march-atlas": {
    "src": "./assets/battle-cel/infantry-march-atlas.png",
    "width": 1330,
    "height": 1182,
    "frames": [
      [
        100,
        60,
        523,
        472
      ],
      [
        765,
        60,
        523,
        472
      ],
      [
        100,
        651,
        523,
        472
      ],
      [
        765,
        651,
        523,
        472
      ]
    ]
  },
  "naval-cel-atlas": {
    "src": "./assets/battle-cel/naval-cel-atlas.png",
    "width": 2172,
    "height": 724,
    "frames": [
      [
        21,
        80,
        682,
        547
      ],
      [
        752,
        87,
        696,
        531
      ],
      [
        1448,
        196,
        686,
        421
      ]
    ]
  },
  "combat-fx-atlas": {
    "src": "./assets/battle-cel/combat-fx-atlas.png",
    "width": 1536,
    "height": 1024,
    "frames": [
      [
        30,
        32,
        471,
        431
      ],
      [
        542,
        32,
        471,
        431
      ],
      [
        1054,
        32,
        471,
        431
      ],
      [
        30,
        544,
        471,
        431
      ],
      [
        542,
        544,
        471,
        431
      ],
      [
        1054,
        544,
        471,
        431
      ]
    ]
  },
  "map-landmarks-atlas": {
    "src": "./assets/battle-cel/map-landmarks-atlas.png",
    "width": 1536,
    "height": 1024,
    "frames": [
      [
        71,
        109,
        434,
        329
      ],
      [
        571,
        119,
        388,
        346
      ],
      [
        1074,
        97,
        393,
        354
      ],
      [
        89,
        556,
        355,
        380
      ],
      [
        569,
        636,
        401,
        238
      ],
      [
        1070,
        630,
        396,
        272
      ]
    ]
  },
  "weapon-fx-atlas": {
    "src": "./assets/battle-cel/weapon-fx-atlas.png",
    "width": 2172,
    "height": 724,
    "frames": [
      [
        99,
        161,
        580,
        391
      ],
      [
        784,
        253,
        609,
        214
      ],
      [
        1514,
        142,
        576,
        418
      ]
    ]
  },
  "water-impact-atlas": {
    "src": "./assets/battle-cel/water-impact-atlas.png",
    "width": 1536,
    "height": 1024,
    "frames": [
      [
        29,
        49,
        468,
        451
      ],
      [
        541,
        49,
        468,
        451
      ],
      [
        1053,
        49,
        468,
        451
      ],
      [
        29,
        561,
        468,
        451
      ],
      [
        541,
        561,
        468,
        451
      ],
      [
        1053,
        561,
        468,
        451
      ]
    ]
  }
};
  if(typeof module==='object'&&module.exports)module.exports=art;else root.FrontBattleArt=art;
})(typeof globalThis!=='undefined'?globalThis:this);
