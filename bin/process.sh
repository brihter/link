#!/bin/sh

set -eu
cd "$(dirname "$0")/.."

curl -s -XGET localhost:3001/load/raw
curl -s -XGET localhost:3001/merge/raw
curl -s -XGET localhost:3001/load/graph
curl -s -XGET localhost:3001/solve
curl -s -XGET localhost:3001/export/graph
curl -s -XGET localhost:3001/analyze
