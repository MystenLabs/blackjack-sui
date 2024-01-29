import React, { ReactElement, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from "@radix-ui/react-icons";

interface GeneralTableProps {
  rows: GeneralTableRow[];
  headers: string[];
  state: GeneralTableState;
  caption: string;
}

interface GeneralTableRow {
  id: string;
  columns: (string | ReactElement)[];
  isSelected: boolean;
}

interface GeneralTableState {
  page: number;
  pageSize: number;
  isLoading: boolean;
}

export const GeneralTable = ({
  rows,
  headers,
  state,
  caption,
}: GeneralTableProps) => {
  const [currentState, setCurrentState] = useState<GeneralTableState>(state);

  const { startIndex, endIndex, hasNextPage, hasPreviousPage } = useMemo(() => {
    const startIndex = currentState.page * currentState.pageSize;
    const endIndex = startIndex + currentState.pageSize;
    const hasNextPage = endIndex < rows.length;
    const hasPreviousPage = startIndex > 0;
    return { startIndex, endIndex, hasPreviousPage, hasNextPage };
  }, [currentState]);

  console.log({ startIndex, endIndex, hasPreviousPage, hasNextPage });

  const handleNextPage = () => {
    setCurrentState((prevState) => ({
      ...prevState,
      page: prevState.page + 1,
    }));
  };

  const handlePreviousPage = () => {
    setCurrentState((prevState) => ({
      ...prevState,
      page: prevState.page - 1,
    }));
  };

  const handleStartPage = () => {
    setCurrentState((prevState) => ({
      ...prevState,
      page: 0,
    }));
  };

  const handleEndPage = () => {
    setCurrentState((prevState) => ({
      ...prevState,
      page: Math.floor(rows.length / prevState.pageSize),
    }));
  };

  return (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => {
            if (index === 0) {
              return (
                <TableHead key={index} className="w-[175px]">
                  {header.toUpperCase()}
                </TableHead>
              );
            }
            return (
              <TableHead key={index} className="text-right">
                {header.toUpperCase()}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(startIndex, endIndex).map((row) => (
          <TableRow key={row.id}>
            {row.columns.map((column, index) => {
              if (typeof column === "string") {
                return (
                  <TableCell key={index} className="text-right">
                    {column}
                  </TableCell>
                );
              } else
                return (
                  <TableCell key={index} className="text-right">
                    {React.cloneElement(column)}
                  </TableCell>
                );
            })}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className="border-t-2 border-grey-100 bg-inherit text-primary">
        <TableRow>
          <TableCell colSpan={headers.length}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="border-primary"
                  disabled={!hasPreviousPage}
                  onClick={handleStartPage}
                >
                  <DoubleArrowLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="border-primary"
                  disabled={!hasPreviousPage}
                  onClick={handlePreviousPage}
                >
                  <TrackPreviousIcon />
                </Button>
                <Button
                  variant="outline"
                  className="border-primary"
                  disabled={!hasNextPage}
                  onClick={handleNextPage}
                >
                  <TrackNextIcon />
                </Button>
                <Button
                  variant="outline"
                  className="border-primary"
                  disabled={!hasNextPage}
                  onClick={handleEndPage}
                >
                  <DoubleArrowRightIcon />
                </Button>
              </div>
              <div className="text-sm">
                Showing {startIndex + 1} to {endIndex} of {rows.length} results
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};
