import "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "l-quantum": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          size?: number | string;
          color?: string;
          speed?: number | string;
        },
        HTMLElement
      >;
      "l-hourglass": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          size?: number | string;
          color?: string;
          speed?: number | string;
          "bg-opacity"?: number | string;
        },
        HTMLElement
      >;
    }
  }
}
