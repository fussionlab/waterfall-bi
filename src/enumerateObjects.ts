
import powerbi from "powerbi-visuals-api";
import VisualObjectInstance = powerbi.VisualObjectInstance;
import PrimitiveValue = powerbi.PrimitiveValue;
import ISelectionId = powerbi.visuals.ISelectionId;
import { VisualSettings, yAxisFormatting, chartOrientation } from "./settings";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import DataView = powerbi.DataView;
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
interface barChartDataPoint {
    value: PrimitiveValue;
    numberFormat: string;
    formattedValue: string;
    originalFormattedValue: string;
    isPillar: number;
    category: string;
    color: string;
    customBarColor: string;
    customFontColor: string;
    customLabelPositioning: string;
    selectionId: ISelectionId;
    childrenCount: number;
    displayName: string;
}

export interface IEnumerateObjects {
    enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject;
}
export function createenumerateObjects(
    visualType: String,
    barChartData: barChartDataPoint[],
    barChartDataAll,
    visualSettings: VisualSettings,
    defaultXAxisGridlineStrokeWidth: PrimitiveValue,
    defaultYAxisGridlineStrokeWidth: PrimitiveValue,
    dataView: DataView
): IEnumerateObjects {
    return new enumerateObjects(
        visualType,
        barChartData,
        barChartDataAll,
        visualSettings,
        defaultXAxisGridlineStrokeWidth,
        defaultYAxisGridlineStrokeWidth,
        dataView);
}
class enumerateObjects implements IEnumerateObjects {
    private visualType: String;
    private barChartData: barChartDataPoint[];
    private visualSettings: VisualSettings;
    private defaultXAxisGridlineStrokeWidth: PrimitiveValue;
    private defaultYAxisGridlineStrokeWidth: PrimitiveValue;
    private dataView: DataView;

    constructor(visualType: String, barchartData: barChartDataPoint[], barchartDataAll, visualSettings: VisualSettings, defaultXAxisGridlineStrokeWidth: PrimitiveValue, defaultYAxisGridlineStrokeWidth: PrimitiveValue, dataView: DataView) {
        this.visualType = visualType;
        this.barChartData = barchartData;
        this.visualSettings = visualSettings;
        this.defaultXAxisGridlineStrokeWidth = defaultXAxisGridlineStrokeWidth;
        this.defaultYAxisGridlineStrokeWidth = defaultYAxisGridlineStrokeWidth;
        this.dataView = dataView;

    }
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let objectName: string = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];
        switch (objectName) {

            case 'chartOrientation':
                this.propertiesChartOrientation(objectName, objectEnumeration);
                break;
            case 'definePillars':
                this.propertiesDefinePillars(objectName, objectEnumeration);
                break;
            case 'Legend':
                this.propertiesLegend(objectName, objectEnumeration);
                break;
            case 'sentimentColor':
                this.propertiesSentimentColor(objectName, objectEnumeration);
                break;
            case 'xAxisFormatting':
                this.propertiesXaxis(objectName, objectEnumeration);
                break;
            case 'yAxisFormatting':
                this.propertiesYaxis(objectName, objectEnumeration);
                break;
            case 'LabelsFormatting':
                this.propertiesLabelFormatting(objectName, objectEnumeration);
                break;
            case 'margins':
                this.propertiesMargin(objectName, objectEnumeration);
                break;

        };

        return objectEnumeration;
    }
    private propertiesDefinePillars(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualType == "static") {
            switch (objectName) {
                case 'definePillars':
                    var isPillarBoolean: boolean;

                    for (var index = 0; index < this.barChartData.length; index++) {
                        if (this.barChartData[index].category != "defaultBreakdownStepOther") {
                            if (this.barChartData[index].isPillar) {
                                isPillarBoolean = true;
                            } else {
                                isPillarBoolean = false;
                            }
                            objectEnumeration.push({
                                objectName: "objectName",
                                displayName: this.barChartData[index].category,
                                properties: {
                                    pillars: isPillarBoolean
                                },
                                selector: this.barChartData[index].selectionId.getSelector()
                            });
                        }
                    }
            }
        }
        if (this.visualType == "staticCategory") {
            var hasPillar: boolean = false;
            switch (objectName) {
                case 'definePillars':
                    var isPillarBoolean: boolean;
                    for (var index = 0; index < this.barChartData.length; index++) {
                        if (this.barChartData[index].category != "defaultBreakdownStepOther") {
                            if (this.barChartData[index].isPillar) {
                                // if the last pillar is the only pillar than treat it as no pillar
                                isPillarBoolean = true;
                                if (index != this.barChartData.length && !this.visualSettings.definePillars.Totalpillar) {
                                    hasPillar = true;
                                }
                                //hasPillar = true;
                            } else {
                                isPillarBoolean = false;
                            }
                            if (!this.visualSettings.definePillars.Totalpillar) {
                                objectEnumeration.push({
                                    objectName: "objectName",
                                    displayName: this.barChartData[index].category,
                                    properties: {
                                        pillars: isPillarBoolean
                                    },
                                    selector: this.barChartData[index].selectionId.getSelector()
                                });
                            }
                        }
                    }
                    if (!hasPillar) {
                        objectEnumeration.push({
                            objectName: "objectName",
                            properties: {
                                Totalpillar: this.visualSettings.definePillars.Totalpillar
                            },
                            selector: null
                        });
                    }
            }
        }
        if (this.visualType == "drillableCategory") {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    Totalpillar: this.visualSettings.definePillars.Totalpillar
                },
                selector: null
            });
        }
    }

    private propertiesLegend(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualSettings.chartOrientation.useSentimentFeatures) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    show: this.visualSettings.Legend.show,
                    textFavourable: this.visualSettings.Legend.textFavourable,
                    textAdverse: this.visualSettings.Legend.textAdverse,
                    fontSize: this.visualSettings.Legend.fontSize,
                    fontColor: this.visualSettings.Legend.fontColor,
                    fontFamily: this.visualSettings.Legend.fontFamily
                },
                selector: null
            });
        }
    }
    private propertiesSentimentColor(objectName: string, objectEnumeration: VisualObjectInstance[]) {        
        if (this.visualType == "static" || this.visualType == "staticCategory") {
            if (this.visualSettings.chartOrientation.useSentimentFeatures && (this.visualType == "static" || this.visualType == "staticCategory")) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        sentimentColorTotal: this.visualSettings.sentimentColor.sentimentColorTotal,
                        sentimentColorFavourable: this.visualSettings.sentimentColor.sentimentColorFavourable,
                        sentimentColorAdverse: this.visualSettings.sentimentColor.sentimentColorAdverse,
                        sentimentColorOther: this.visualSettings.sentimentColor.sentimentColorOther
                    },
                    selector: null
                });
            } else {
                for (var index = 0; index < this.barChartData.length; index++) {
                    if (this.barChartData[index].category != "defaultBreakdownStepOther") {
                        objectEnumeration.push({
                            objectName: "objectName",
                            displayName: this.barChartData[index].category,
                            properties: {
                                fill: {
                                    solid: {
                                        color: this.barChartData[index].customBarColor
                                    }
                                }
                            },
                            //selector: this.barChartData[index].selectionId.getSelector()

                            //More help on conditional formatting
                            //https://docs.microsoft.com/en-us/power-bi/developer/visuals/conditional-format

                            // Define whether the conditional formatting will apply to instances, totals, or both
                            selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),

                            // Add this property with the value previously defined for the selector property
                            altConstantValueSelector: this.barChartData[index].selectionId.getSelector(),

                            propertyInstanceKind: {
                                fill: VisualEnumerationInstanceKinds.ConstantOrRule
                            }
                        });
                    } else {
                        objectEnumeration.push({
                            objectName: "objectName",
                            //displayName: this.barChartData[index].category,
                            properties: {
                                sentimentColorOther: this.visualSettings.sentimentColor.sentimentColorOther
                            },
                            selector: null
                        });
                    }
                }
            }
        } else {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    sentimentColorTotal: this.visualSettings.sentimentColor.sentimentColorTotal,
                    sentimentColorFavourable: this.visualSettings.sentimentColor.sentimentColorFavourable,
                    sentimentColorAdverse: this.visualSettings.sentimentColor.sentimentColorAdverse,
                    sentimentColorOther: this.visualSettings.sentimentColor.sentimentColorOther
                },
                selector: null
            });
        }
    }
    private propertiesChartOrientation(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualType == "static" || this.visualType == "staticCategory") {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    orientation: this.visualSettings.chartOrientation.orientation,
                    useSentimentFeatures: this.visualSettings.chartOrientation.useSentimentFeatures,
                    sortData: this.visualSettings.chartOrientation.sortData
                },
                selector: null
            });
            if (this.visualType == "staticCategory") {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        limitBreakdown: this.visualSettings.chartOrientation.limitBreakdown
                    },
                    selector: null
                });
                if (this.visualSettings.chartOrientation.limitBreakdown) {
                    objectEnumeration.push({
                        objectName: "objectName",
                        properties: {
                            maxBreakdown: this.visualSettings.chartOrientation.maxBreakdown
                        },
                        selector: null
                    });
                    objectEnumeration[2].validValues = {
                        maxBreakdown: { numberRange: { min: 1, max: 100 } }
                    };
                }
            }
        } else if (this.dataView.matrix.rows.levels.length === 1 /* && this.visualType == "drillable" */) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    orientation: this.visualSettings.chartOrientation.orientation,
                    sortData: this.visualSettings.chartOrientation.sortData
                },
                selector: null
            });
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    limitBreakdown: this.visualSettings.chartOrientation.limitBreakdown
                },
                selector: null
            });
            if (this.visualSettings.chartOrientation.limitBreakdown) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        maxBreakdown: this.visualSettings.chartOrientation.maxBreakdown
                    },
                    selector: null
                });
                objectEnumeration[2].validValues = {
                    maxBreakdown: { numberRange: { min: 1, max: 100 } }
                };
            }
        } else {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    orientation: this.visualSettings.chartOrientation.orientation
                },
                selector: null
            });

        }



    }
    private propertiesXaxis(objectName: string, objectEnumeration) {
        objectEnumeration.push({
            objectName: "objectName",
            
            properties: {
                fontSize: this.visualSettings.xAxisFormatting.fontSize,
                fontColor: this.visualSettings.xAxisFormatting.fontColor,
                fontFamily: this.visualSettings.xAxisFormatting.fontFamily,
                fitToWidth: this.visualSettings.xAxisFormatting.fitToWidth,
                labelWrapText: this.visualSettings.xAxisFormatting.labelWrapText,
                showAngle: this.visualSettings.xAxisFormatting.showAngle
            },
            selector: null
        });
        if (!this.visualSettings.xAxisFormatting.showAngle) {
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                xLabelAngle: this.visualSettings.xAxisFormatting.xLabelAngle
            },
            selector: null
        });
        objectEnumeration[objectEnumeration.length - 1].validValues = {
            xLabelAngle: { numberRange: { min: -90, max: 90 } }

        };
        }
        if (!this.visualSettings.xAxisFormatting.fitToWidth) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    barWidth: this.visualSettings.xAxisFormatting.barWidth
                },
                selector: null
            });

            objectEnumeration[1].validValues = {
                barWidth: { numberRange: { min: 10, max: 100 } }

            };
        }


        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                padding: this.visualSettings.xAxisFormatting.padding,
                showGridLine: this.visualSettings.xAxisFormatting.showGridLine
            },
            selector: null
        });
        objectEnumeration[objectEnumeration.length - 1].validValues = {
            padding: { numberRange: { min: 0, max: 20 } }

        };
        
        if (this.visualSettings.xAxisFormatting.showGridLine) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    gridLineStrokeWidth: this.defaultXAxisGridlineStrokeWidth,
                    gridLineColor: {
                        solid: {
                            color: this.visualSettings.xAxisFormatting.gridLineColor
                        }
                    }
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                gridLineStrokeWidth: { numberRange: { min: 1, max: 50 } }
            };
        }
    }
    private propertiesYaxis(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                show: this.visualSettings.yAxisFormatting.show,
                YAxisDataPointOption: this.visualSettings.yAxisFormatting.YAxisDataPointOption,
                showYAxisValues: this.visualSettings.yAxisFormatting.showYAxisValues
            },
            selector: null
        });
        if (this.visualSettings.yAxisFormatting.showYAxisValues) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    fontSize: this.visualSettings.yAxisFormatting.fontSize,
                    fontColor: this.visualSettings.yAxisFormatting.fontColor,
                    YAxisValueFormatOption: this.visualSettings.yAxisFormatting.YAxisValueFormatOption,
                    decimalPlaces: this.visualSettings.yAxisFormatting.decimalPlaces

                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                decimalPlaces: { numberRange: { min: 0, max: 15 } }

            }
        }
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                showGridLine: this.visualSettings.yAxisFormatting.showGridLine
            },
            selector: null
        });
        if (this.visualSettings.yAxisFormatting.showGridLine) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    gridLineStrokeWidth: this.defaultYAxisGridlineStrokeWidth,
                    gridLineColor: {
                        solid: {
                            color: this.visualSettings.yAxisFormatting.gridLineColor
                        }
                    }
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                gridLineStrokeWidth: { numberRange: { min: 1, max: 50 } }

            };
        }
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                showZeroAxisGridLine: this.visualSettings.yAxisFormatting.showZeroAxisGridLine
            },
            selector: null
        });
        if (this.visualSettings.yAxisFormatting.showZeroAxisGridLine) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {

                    zeroLineStrokeWidth: this.visualSettings.yAxisFormatting.zeroLineStrokeWidth,
                    zeroLineColor: {
                        solid: {
                            color: this.visualSettings.yAxisFormatting.zeroLineColor
                        }
                    }
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                zeroLineStrokeWidth: { numberRange: { min: 1, max: 50 } }

            };
        }
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                joinBars: this.visualSettings.yAxisFormatting.joinBars
            },
            selector: null
        });
        if (this.visualSettings.yAxisFormatting.joinBars) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    joinBarsStrokeWidth: this.visualSettings.yAxisFormatting.joinBarsStrokeWidth,
                    joinBarsColor: this.visualSettings.yAxisFormatting.joinBarsColor
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                joinBarsStrokeWidth: { numberRange: { min: 1, max: 50 } }

            };
        }
    }
    private propertiesLabelFormatting(objectName: string, objectEnumeration: VisualObjectInstance[]) {
       
        if (this.visualSettings.LabelsFormatting.show) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    show: this.visualSettings.LabelsFormatting.show,
                    fontSize: this.visualSettings.LabelsFormatting.fontSize,
                    useDefaultFontColor: this.visualSettings.LabelsFormatting.useDefaultFontColor,
                },
                selector: null
            });

            this.propertiesDefaultFontColor(objectName, objectEnumeration);
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    fontFamily: this.visualSettings.LabelsFormatting.fontFamily
                },
                selector: null
            });

            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    useDefaultLabelPositioning: this.visualSettings.LabelsFormatting.useDefaultLabelPositioning,
                },
                selector: null
            });

            this.propertiesDefaultLabelFormatting(objectName, objectEnumeration);

            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    valueFormat: this.visualSettings.LabelsFormatting.valueFormat,
                    decimalPlaces: this.visualSettings.LabelsFormatting.decimalPlaces
                },
                selector: null
            });
            objectEnumeration[objectEnumeration.length - 1].validValues = {
                decimalPlaces: { numberRange: { min: 0, max: 15 } }

            };
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    HideZeroBlankValues: this.visualSettings.LabelsFormatting.HideZeroBlankValues
                },
                selector: null
            });
        } else {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    show: this.visualSettings.LabelsFormatting.show
                },
                selector: null
            });
        }
    }
    private propertiesDefaultLabelFormatting(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualSettings.LabelsFormatting.useDefaultLabelPositioning) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    labelPosition: this.visualSettings.LabelsFormatting.labelPosition,
                },
                selector: null
            });
        } else {

            if (this.visualSettings.chartOrientation.useSentimentFeatures || (this.visualType != "static" && this.visualType != "staticCategory")) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        labelPositionTotal: this.visualSettings.LabelsFormatting.labelPositionTotal,
                        labelPositionFavourable: this.visualSettings.LabelsFormatting.labelPositionFavourable,
                        labelPositionAdverse: this.visualSettings.LabelsFormatting.labelPositionAdverse,
                        labelPositionOther: this.visualSettings.LabelsFormatting.labelPositionOther
                    },
                    selector: null
                });
            } else {
                if (this.visualType == "static" || this.visualType == "staticCategory") {
                    for (var index = 0; index < this.barChartData.length; index++) {
                        if (this.barChartData[index].category != "defaultBreakdownStepOther") {
                            objectEnumeration.push({
                                objectName: "objectName",
                                displayName: this.barChartData[index].category,
                                properties: {
                                    labelPosition: this.barChartData[index].customLabelPositioning
                                },
                                selector: this.barChartData[index].selectionId.getSelector()
                            });
                        } else {
                            objectEnumeration.push({
                                objectName: "objectName",
                                displayName: this.barChartData[index].displayName,
                                properties: {
                                    labelPositionOther: this.visualSettings.LabelsFormatting.labelPositionOther
                                },
                                selector: null
                            });
                        }
                    }
                }
            }
        }
    }
    private propertiesDefaultFontColor(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        if (this.visualSettings.LabelsFormatting.useDefaultFontColor) {
            objectEnumeration.push({
                objectName: "objectName",
                properties: {
                    fontColor: this.visualSettings.LabelsFormatting.fontColor,
                },
                selector: null
            });
        } else {

            if (this.visualSettings.chartOrientation.useSentimentFeatures || (this.visualType != "static" && this.visualType != "staticCategory")) {
                objectEnumeration.push({
                    objectName: "objectName",
                    properties: {
                        sentimentFontColorTotal: this.visualSettings.LabelsFormatting.sentimentFontColorTotal,
                        sentimentFontColorFavourable: this.visualSettings.LabelsFormatting.sentimentFontColorFavourable,
                        sentimentFontColorAdverse: this.visualSettings.LabelsFormatting.sentimentFontColorAdverse,
                        sentimentFontColorOther: this.visualSettings.LabelsFormatting.sentimentFontColorOther
                    },
                    selector: null
                });
            } else {
                if (this.visualType == "static" || this.visualType == "staticCategory") {
                    for (var index = 0; index < this.barChartData.length; index++) {
                        if (this.barChartData[index].category != "defaultBreakdownStepOther") {
                            objectEnumeration.push({
                                objectName: "objectName",
                                displayName: this.barChartData[index].category,
                                properties: {
                                    fill: {
                                        solid: {
                                            color: this.barChartData[index].customFontColor
                                        }
                                    }
                                },
                                //selector: this.barChartData[index].selectionId.getSelector()


                                //More help on conditional formatting
                                //https://docs.microsoft.com/en-us/power-bi/developer/visuals/conditional-format

                                // Define whether the conditional formatting will apply to instances, totals, or both
                                selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),

                                // Add this property with the value previously defined for the selector property
                                altConstantValueSelector: this.barChartData[index].selectionId.getSelector(),

                                propertyInstanceKind: {
                                    fill: VisualEnumerationInstanceKinds.ConstantOrRule
                                }

                            });
                        } else {
                            objectEnumeration.push({
                                objectName: "objectName",
                                displayName: this.barChartData[index].displayName,
                                properties: {
                                    sentimentFontColorOther: this.visualSettings.LabelsFormatting.sentimentFontColorOther
                                },
                                selector: null
                            });
                        }
                    }
                }
            }
        }
    }
    private propertiesMargin(objectName: string, objectEnumeration: VisualObjectInstance[]) {
        objectEnumeration.push({
            objectName: "objectName",
            properties: {
                topMargin: this.visualSettings.margins.topMargin,
                bottomMargin: this.visualSettings.margins.bottomMargin,
                leftMargin: this.visualSettings.margins.leftMargin,
                rightMargin: this.visualSettings.margins.rightMargin
            },

            selector: null
        });
        objectEnumeration[0].validValues = {
            topMargin: { numberRange: { min: 0, max: 100 } },
            leftMargin: { numberRange: { min: 0, max: 100 } },
            bottomMargin: { numberRange: { min: 0, max: 100 } },
            rightMargin: { numberRange: { min: 0, max: 100 } }
        };
    }
}