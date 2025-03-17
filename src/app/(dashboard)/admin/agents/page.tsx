"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  ArrowDown,
  Search,
  Plus,
  ArrowUpDown,
  ListFilter,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@components/ui/sheet";
import { Checkbox } from "@components/ui/checkbox";
import { BiEdit } from "react-icons/bi";
import Pagination from "@components/admin/productPagination";
import Link from "next/link";
import Image from "next/image";
import AgentModal from "@components/admin/agentModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import EditAgentModal from "@components/admin/editAgentModal";

// Dummy data for agents
const agents = [
  {
    id: 1,
    name: "John Doe",
    phoneNumber: "+234 812 345 6789",
    email: "johndoe@example.com",
    location: "Ikeja, Lagos",
    status: "Onboarded",
    image: "/images/agent1.jpg",
  },
  {
    id: 2,
    name: "Jane Smith",
    phoneNumber: "+234 812 345 6789",
    email: "janesmith@example.com",
    location: "Victoria Island, Lagos",
    status: "Trial",
    image: "/images/agent2.jpg",
  },
  {
    id: 3,
    name: "Michael Brown",
    phoneNumber: "+234 812 345 6789",
    email: "michaelbrown@example.com",
    location: "Lekki, Lagos",
    status: "Archived",
    image: "/images/agent3.jpg",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    phoneNumber: "+234 812 345 6789",
    email: "sarahjohnson@example.com",
    location: "Surulere, Lagos",
    status: "Onboarded",
    image: "/images/agent4.jpg",
  },
  {
    id: 5,
    name: "David Williams",
    phoneNumber: "+234 812 345 6789",
    email: "davidwilliams@example.com",
    location: "Yaba, Lagos",
    status: "Trial",
    image: "/images/agent5.jpg",
  },
];

export default function Agents() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    location: string;
    image: string;
    status: string;
  }>();

  const toggleFilter = (
    value: string,
    setFilter: Function,
    selectedFilter: string[]
  ) => {
    setFilter((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedStatus.length === 0 || selectedStatus.includes(agent.status))
  );

  const handleUpdateAgent = (updatedAgent: any) => {
    const updatedAgents = agents.map((agent) =>
      agent.id === selectedAgent?.id ? { ...agent, ...updatedAgent } : agent
    );
    console.log("Updated Agents:", updatedAgents); 
    setIsEditModalOpen(false);
  };

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Agents</h2>
          <p className="text-[#475467]">Manage company agents here.</p>
        </div>
        <Button
          className="bg-[#1B6013] text-white"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus size={16} /> Add New Agent
        </Button>
        <AgentModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={(data) => {
            // Add new agent logic here
            setIsDialogOpen(false);
          }}
        />
      </div>

      {/* Search & Filter Section */}
      <div className="flex items-center justify-between w-full py-4">
        <div className="relative w-full max-w-[400px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search for agents"
            className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]">
            <ArrowUpDown size={16} />
            Sort
          </button>

          {/* Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1 px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]">
                <ListFilter size={16} />
                Filters
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="!px-0">
              <SheetHeader className="px-4">
                <div className="flex justify-between items-center">
                  <SheetTitle>Filters</SheetTitle>
                  <button
                    onClick={() =>
                      document.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "Escape" })
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[#475467] text-sm">
                  Apply filters to table data.
                </p>
              </SheetHeader>
              <div className="mt-6 px-4">
                <h3 className="text-sm text-[#344054] font-medium mb-2">
                  Status
                </h3>
                {["Onboarded", "Trial", "Archived"].map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={status}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedStatus.includes(status)}
                      onCheckedChange={() =>
                        toggleFilter(status, setSelectedStatus, selectedStatus)
                      }
                    />
                    <label className="font-medium text-sm" htmlFor={status}>
                      {status}
                    </label>
                  </div>
                ))}
              </div>
              <SheetFooter className="border-t pt-4 !w-full">
                <div className="font-semibold text-sm flex justify-between items-end px-4">
                  <div
                    className="text-[#B42318] cursor-pointer"
                    onClick={() => {
                      setSelectedStatus([]);
                    }}
                  >
                    Clear all filters
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={"outline"}
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#1B6013]">Apply</Button>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full max-w-[1200px] mx-auto">
        <Table className="border border-gray-300 rounded-lg shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)] overflow-hidden w-full">
          <TableHeader>
            <TableRow className="bg-[#EAECF0]">
              {[
                "Agent",
                "Phone Number",
                "Email Address",
                "Location",
                "Current Status",
              ].map((head) => (
                <TableHead
                  key={head}
                  className="text-center px-6 py-3 font-medium text-gray-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    {head} <ArrowDown size={16} strokeWidth={0.7} />
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center px-6 py-3 font-medium text-gray-700"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedAgents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="text-left px-6 py-4 flex gap-2 items-center">
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  {agent.name}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {agent.phoneNumber}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {agent.email}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {agent.location}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Select
                    defaultValue={agent.status}
                    onValueChange={(value) => {
                      // Update agent status logic here
                    }}
                  >
                    <SelectTrigger className="w-[140px] border p-3 rounded-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarded">Onboarded</SelectItem>
                      <SelectItem value="Trial">Trial</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <BiEdit
                    className="text-gray-600 hover:text-gray-900 cursor-pointer"
                    size={20}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsEditModalOpen(true); 
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center mt-6">
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateAgent}
        agent={selectedAgent}
      />
    </div>
  );
}