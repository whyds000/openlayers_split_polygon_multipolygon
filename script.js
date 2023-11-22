

let regularStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#0e97fa',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: [0, 0, 0, 0.2]
    }),
});

let highlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: [255, 0, 0, 0.6],
        width: 2
    }),
    fill: new ol.style.Fill({
        color: [255, 0, 0, 0.2]
    }),
    zIndex: 1
});

class OLMap {

    constructor(map_div, zoom, center) {
        this.map = new ol.Map({
            interactions: ol.interaction.defaults({
                doubleClickZoom: false
            }),
            target: map_div,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat(center),
                zoom: zoom
            })
        });
    }
}



class VectorLayer {

    constructor(title, map) {
        this.layer = new ol.layer.Vector({
            title: title,
            source: new ol.source.Vector({
                projection: map.getView().projection
            }),
            style: regularStyle
        });
    }
}





class Draw {

    constructor(type, map, vector_layer) {
        this.type = type;
        this.vector_layer = vector_layer
        this.map = map;
        this.interaction = new ol.interaction.Draw({
            type: type,
            stopClick: true
        });

        this.splitArrs = []
        if (type === "LineString") {
            this.interaction.on('drawstart', this.onDrawStart);
        }
        else {
            this.vector_layer.getSource().clear();
        }
        this.interaction.on('drawend', this.onDrawEnd);
        this.map.addInteraction(this.interaction);
    }

    onDrawStart = (e) => {

        this.splitArrs = []
        e.feature.getGeometry().on('change', this.onGeomChange);
    }

    onDrawEnd = (e) => {

        this.map.removeInteraction(this.interaction);

        if (this.type === "Polygon" || this.type === 'MultiPolygon') {
            this.vector_layer.getSource().addFeature(e.feature);
            polygon = e.feature;
        }
        if (this.type === 'LineString') {
            this.splitPolygon()
        }
    }

    onGeomChange = (e) => {



        let parser = new jsts.io.OL3Parser();


        let linestring = new ol.Feature({
            geometry: new ol.geom.LineString(e.target.getCoordinates())
        });

        if (polygon.getGeometry().getType() === 'MultiPolygon') {
            const arr = polygon.getGeometry().getCoordinates()
            const splitArrs = []
            arr.forEach((it, index) => {

                const _polygon = new ol.Feature({
                    geometry: new ol.geom.Polygon(it)
                })

                let polygon_to_split = parser.read(_polygon.getGeometry());

                let line = parser.read(linestring.getGeometry());
                let holes = polygon_to_split._holes;
                let union = polygon_to_split.getExteriorRing().union(line);
                let polygonizer = new jsts.operation.polygonize.Polygonizer();
                polygonizer.add(union);
                let polygons = polygonizer.getPolygons();

                if (polygons.array.length == 2) {
                    polygons.array.forEach((geom) => {


                        holes.forEach((hole) => {
                            let arr = []
                            for (let i in hole.getCoordinates()) {
                                arr.push([hole.getCoordinates()[i].x, hole.getCoordinates()[i].y])
                            }
                            hole = parser.read(new ol.geom.Polygon([arr]));
                            geom = geom.difference(hole);
                        });


                        let splitted_polygon = new ol.Feature({
                            geometry: new ol.geom.Polygon(parser.write(geom).getCoordinates())
                        });

                        splitArrs.push(splitted_polygon)


                    });


                }
            })
            this.splitArrs = splitArrs

        } else {


            let polygon_to_split = parser.read(polygon.getGeometry());

            let line = parser.read(linestring.getGeometry());



            let holes = polygon_to_split._holes;
            let union = polygon_to_split.getExteriorRing().union(line);
            let polygonizer = new jsts.operation.polygonize.Polygonizer();


            polygonizer.add(union);


            let polygons = polygonizer.getPolygons();
            const splitArrs = []

            if (polygons.array.length == 2) {
                polygons.array.forEach((geom) => {
                    holes.forEach((hole) => {
                        let arr = []
                        for (let i in hole.getCoordinates()) {
                            arr.push([hole.getCoordinates()[i].x, hole.getCoordinates()[i].y])
                        }
                        hole = parser.read(new ol.geom.Polygon([arr]));
                        geom = geom.difference(hole);
                    });


                    let splitted_polygon = new ol.Feature({
                        geometry: new ol.geom.Polygon(parser.write(geom).getCoordinates())
                    });
                    splitArrs.push(splitted_polygon)

                });

            }
            this.splitArrs = splitArrs

        }


    }


    splitPolygon = () => {

        if (this.splitArrs.length > 1) {
            this.vector_layer.getSource().clear();
            this.splitArrs.forEach(it => {
                this.vector_layer.getSource().addFeature(it)
            })
            if (polygon.getGeometry().getCoordinates().length !== this.splitArrs.length / 2) {
                const index = this.splitArrs.length / 2 - 1
                const arr = polygon.getGeometry().getCoordinates().slice()
                arr.splice(index, 1)
                const _polygon=new ol.Feature({
                    geometry:new ol.geom.MultiPolygon(arr)
                })
                this.vector_layer.getSource().addFeature(_polygon)

            }



        }
    }
}



class Snapping {

    constructor(map, vector_source) {
        this.map = map;
        this.vector_source = vector_source
        this.interaction = new ol.interaction.Snap({
            source: vector_source
        });
        this.map.addInteraction(this.interaction);
    }
}



let map = new OLMap('map', 9, [-93.9566742, 32.5697505]).map;
let vector_layer = new VectorLayer('Temp Layer', map).layer
map.addLayer(vector_layer);



let polygon = new ol.Feature({
    geometry: new ol.geom.MultiPolygon([
        [
            [
                [
                    -10559953.131853368,
                    3939077.803947223
                ],
                [
                    -10561787.620532213,
                    3881291.4105636296
                ],
                [
                    -10438876.879049648,
                    3892604.0907498356
                ],
                [
                    -10447743.574330729,
                    3946415.7586626
                ],
                [
                    -10559953.131853368,
                    3939077.803947223
                ]
            ]
        ],
        [
            [
                [
                    -10540691.000725504,
                    3877622.433205941
                ],
                [
                    -10536716.275254674,
                    3836957.9341582274
                ],
                [
                    -10432761.916786835,
                    3854079.828494107
                ],
                [
                    -10442545.856407337,
                    3891686.8464104137
                ],
                [
                    -10540691.000725504,
                    3877622.433205941
                ]
            ]
        ],
        [
            [
                [-10573192.845215201, 3862791.7734972173],
                [-10517913.590091638, 3906819.506454825],
                [-10412002.436235145, 3867683.743307469],
                [-10407844.269360984, 3804577.3346213656],
                [-10498101.116092397, 3760305.011570868],
                [-10584933.570893666, 3790879.8228849387],
                [-10573192.845215201, 3862791.7734972173]
            ],
            [
                [-10524942.4368245, 3798269.8555756304],
                [-10519136.5825442, 3778191.276189599],
                [-10450954.753313825, 3795007.422412338],
                [-10460432.944821186, 3819773.0195767353],
                [-10524942.4368245, 3798269.8555756304]
            ],
            [
                [-10543753.099429488, 3859944.0038188365],
                [-10542067.691029754, 3830168.4554235185],
                [-10458904.204255482, 3844538.6167411325],
                [-10464407.670292014, 3875419.1761683435],
                [-10543753.099429488, 3859944.0038188365]
            ]
        ]
    ])
});
vector_layer.getSource().addFeature(polygon);



let draw = null;
let btnClick = (e) => {
    removeInteractions();
    let geomType = e.srcElement.attributes.geomtype.nodeValue;

    //Create interaction
    draw = new Draw(geomType, map, vector_layer);
    if (geomType == "LineString") {
        new Snapping(map, vector_layer.getSource())
    }
}



let removeInteractions = () => {
    map.getInteractions().getArray().forEach((interaction, i) => {
        if (i > 8) {
            map.removeInteraction(interaction);
        }
    });
}

//Drag feature
let dragFeature = () => {
    removeInteractions();
    map.addInteraction(new ol.interaction.Translate());
}



let clear = () => {
    removeInteractions();
    map.getOverlays().clear();
    vector_layer.getSource().clear();
}


let distanceMeasure = document.getElementById('btn1');
distanceMeasure.onclick = btnClick;

let areaMeasure = document.getElementById('btn2');
areaMeasure.onclick = btnClick;

let clearGraphics = document.getElementById('btn3');
clearGraphics.onclick = clear;


let drag = document.getElementById('btn4');
drag.onclick = dragFeature;
