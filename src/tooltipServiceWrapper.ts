import powerbi from "powerbi-visuals-api";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ITooltipService = powerbi.extensibility.ITooltipService;
import ISelectionId = powerbi.extensibility.ISelectionId;
import * as d3 from "d3";

export interface TooltipEventArgs<TData> {
    data: TData;
    coordinates: number[];
    elementCoordinates: number[];
    context: HTMLElement;
    isTouchEvent: boolean;
}

export interface ITooltipServiceWrapper {
    addTooltip<T>(
        selection: d3.Selection<any, any, any, any>,
        getTooltipInfoDelegate: (args: TooltipEventArgs<T>) => VisualTooltipDataItem[],
        getDataPointIdentity: (args: TooltipEventArgs<T>) => ISelectionId,
        reloadTooltipDataOnMouseMove?: boolean
    ): void;
    hide(): void;
}

const DefaultHandleTouchDelay = 1000;

export function createTooltipServiceWrapper(
    tooltipService: ITooltipService,
    rootElement: HTMLElement,
    handleTouchDelay: number = DefaultHandleTouchDelay
): ITooltipServiceWrapper {
    return new TooltipServiceWrapper(tooltipService, rootElement, handleTouchDelay);
}

class TooltipServiceWrapper implements ITooltipServiceWrapper {
    private handleTouchTimeoutId: number | undefined;
    private visualHostTooltipService: ITooltipService;
    private rootElement: HTMLElement;
    private handleTouchDelay: number;

    constructor(tooltipService: ITooltipService, rootElement: HTMLElement, handleTouchDelay: number) {
        this.visualHostTooltipService = tooltipService;
        this.handleTouchDelay = handleTouchDelay;
        this.rootElement = rootElement;
    }

    public addTooltip<T>(
        selection: d3.Selection<any, any, any, any>,
        getTooltipInfoDelegate: (args: TooltipEventArgs<T>) => VisualTooltipDataItem[],
        getDataPointIdentity: (args: TooltipEventArgs<T>) => ISelectionId,
        reloadTooltipDataOnMouseMove?: boolean
    ): void {
        if (!selection || !this.visualHostTooltipService.enabled()) {
            return;
        }
        this.addMouseEvents(selection, getTooltipInfoDelegate, getDataPointIdentity, reloadTooltipDataOnMouseMove);
        this.addTouchEvents(selection, getTooltipInfoDelegate, getDataPointIdentity);
    }

    private addMouseEvents<T>(
        selection: d3.Selection<any, any, any, any>,
        getTooltipInfoDelegate: (args: TooltipEventArgs<T>) => VisualTooltipDataItem[],
        getDataPointIdentity: (args: TooltipEventArgs<T>) => ISelectionId,
        reloadTooltipDataOnMouseMove?: boolean
    ): void {
        const rootNode = this.rootElement;

        selection.on("mouseover.tooltip", (event: MouseEvent) => {
            if (!this.canDisplayTooltip(event)) return;

            const tooltipEventArgs = this.makeTooltipEventArgs<T>(event, rootNode, false, false);
            if (!tooltipEventArgs) return;

            const tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
            if (!tooltipInfo) return;

            const selectionId = getDataPointIdentity(tooltipEventArgs);

            this.visualHostTooltipService.show({
                coordinates: [event.clientX, event.clientY],
                isTouchEvent: false,
                dataItems: tooltipInfo,
                identities: selectionId ? [selectionId] : [],
            });
        });

        selection.on("mousemove.tooltip", (event: MouseEvent) => {
            if (!this.canDisplayTooltip(event)) return;

            const tooltipEventArgs = this.makeTooltipEventArgs<T>(event, rootNode, false, false);
            if (!tooltipEventArgs) return;

            const tooltipInfo = reloadTooltipDataOnMouseMove
                ? getTooltipInfoDelegate(tooltipEventArgs)
                : undefined;

            const selectionId = getDataPointIdentity(tooltipEventArgs);

            this.visualHostTooltipService.move({
                coordinates: [event.clientX, event.clientY],
                isTouchEvent: false,
                dataItems: tooltipInfo,
                identities: selectionId ? [selectionId] : [],
            });
        });

        selection.on("mouseout.tooltip", () => {
            return this.visualHostTooltipService.hide({
                isTouchEvent: false,
                immediately: false
            });
        });
    }

    private addTouchEvents<T>(
        selection: d3.Selection<any, any, any, any>,
        getTooltipInfoDelegate: (args: TooltipEventArgs<T>) => VisualTooltipDataItem[],
        getDataPointIdentity: (args: TooltipEventArgs<T>) => ISelectionId
    ): void {
        const rootNode = this.rootElement;

        selection.on("pointerdown.tooltip", (event: PointerEvent) => {
            const tooltipEventArgs = this.makeTooltipEventArgs<T>(event, rootNode, true, true);
            if (!tooltipEventArgs) return;

            const tooltipInfo = getTooltipInfoDelegate(tooltipEventArgs);
            const selectionId = getDataPointIdentity(tooltipEventArgs);

            this.visualHostTooltipService.show({
                coordinates: d3.pointer(event, rootNode),
                isTouchEvent: true,
                dataItems: tooltipInfo,
                identities: selectionId ? [selectionId] : [],
            });
        });

        selection.on("pointerup.tooltip", () => {
            this.visualHostTooltipService.hide({
                isTouchEvent: true,
                immediately: false
            });

            if (this.handleTouchTimeoutId) clearTimeout(this.handleTouchTimeoutId);

            this.handleTouchTimeoutId = window.setTimeout(() => {
                this.handleTouchTimeoutId = undefined;
            }, this.handleTouchDelay);
        });
    }

    public hide(): void {
        this.visualHostTooltipService.hide({ immediately: true, isTouchEvent: false });
    }

    private makeTooltipEventArgs<T>(
        event: Event,
        rootNode: HTMLElement,
        isPointerEvent: boolean,
        isTouchEvent: boolean
    ): TooltipEventArgs<T> | null {
        const target = event.target as HTMLElement;
    
        // Retrieve the data bound to the element; handle undefined gracefully
        const boundData = d3.select(target).datum() as T | undefined;
        if (!boundData) {
            return null; // If no data is bound, return null
        }
    
        const coordinates = d3.pointer(event, rootNode);
        const elementCoordinates = d3.pointer(event, target);
    
        return {
            data: boundData, // Use the retrieved data
            coordinates,
            elementCoordinates,
            context: target,
            isTouchEvent,
        };
    }
    

    private canDisplayTooltip(event: MouseEvent): boolean {
        return event.buttons === undefined || event.buttons === 0;
    }
}
